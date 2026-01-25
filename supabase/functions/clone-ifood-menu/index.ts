const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  restaurant_id: string;
  method: 'link' | 'cnpj';
  ifood_link?: string;
  cnpj?: string;
  discount_percent?: number;
}

interface IFoodProduct {
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
}

interface IFoodCategory {
  name: string;
  products: IFoodProduct[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { restaurant_id, method, ifood_link, cnpj, discount_percent = 0 } = body;

    if (!restaurant_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'restaurant_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let ifoodUrl = ifood_link;
    
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Serviço de scraping não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If using CNPJ, search for the restaurant on iFood
    if (method === 'cnpj' && cnpj) {
      // Clean CNPJ - remove all non-numeric characters
      const cleanCnpj = cnpj.replace(/\D/g, '');
      
      if (cleanCnpj.length !== 14) {
        return new Response(
          JSON.stringify({ success: false, error: 'CNPJ inválido. Deve conter 14 dígitos.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Searching iFood for CNPJ:', cleanCnpj);

      // Use Firecrawl search to find the restaurant on iFood
      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `site:ifood.com.br ${cleanCnpj}`,
          limit: 5,
        }),
      });

      const searchData = await searchResponse.json();
      console.log('iFood search results:', JSON.stringify(searchData).slice(0, 500));

      if (!searchResponse.ok || !searchData.success) {
        console.error('Search failed:', searchData);
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao buscar restaurante no iFood' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Look for a valid iFood restaurant URL in results
      const ifoodResults = searchData.data?.filter((result: any) => 
        result.url && result.url.includes('ifood.com.br/delivery/')
      ) || [];

      if (ifoodResults.length === 0) {
        // Try alternative search with formatted CNPJ
        const formattedCnpj = `${cleanCnpj.slice(0,2)}.${cleanCnpj.slice(2,5)}.${cleanCnpj.slice(5,8)}/${cleanCnpj.slice(8,12)}-${cleanCnpj.slice(12)}`;
        
        const altSearchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `site:ifood.com.br restaurante ${formattedCnpj}`,
            limit: 5,
          }),
        });

        const altSearchData = await altSearchResponse.json();
        console.log('Alternative search results:', JSON.stringify(altSearchData).slice(0, 500));

        const altResults = altSearchData.data?.filter((result: any) => 
          result.url && result.url.includes('ifood.com.br/delivery/')
        ) || [];

        if (altResults.length === 0) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Restaurante não encontrado no iFood com este CNPJ. Verifique se o CNPJ está correto ou use o link do cardápio.' 
            }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        ifoodUrl = altResults[0].url;
      } else {
        ifoodUrl = ifoodResults[0].url;
      }

      console.log('Found iFood URL:', ifoodUrl);
    }

    if (!ifoodUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Link do iFood é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize the iFood URL
    if (!ifoodUrl.startsWith('http://') && !ifoodUrl.startsWith('https://')) {
      ifoodUrl = `https://${ifoodUrl}`;
    }

    console.log('Scraping iFood URL:', ifoodUrl);

    // Use Firecrawl to scrape the iFood page with JSON extraction
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: ifoodUrl,
      formats: ['extract', 'html'],
        // iFood é uma página pesada (muito JS). Aumente o timeout e reduza conteúdo para evitar SCRAPE_TIMEOUT.
        timeout: 120000,
        onlyMainContent: true,
        extract: {
          prompt: `Extract the complete restaurant menu from this iFood page. Return a JSON object with:
          - restaurant_name: the restaurant name
          - categories: array of categories, each with:
            - name: category name (e.g., "Pizzas", "Bebidas", "Lanches")
            - products: array of products with:
              - name: product name (exactly as displayed)
              - description: product description text (optional, can be null)
              - price: price as a decimal number (extract from Brazilian format "R$ 29,90" and convert to 29.90)
            - image_url: the ACTUAL product image URL from img src, data-src, or srcset attributes (look for URLs containing static.ifood-static.com.br/image/upload/, cloudinary, or other CDN URLs with actual image IDs. Extract the highest resolution available, preferring t_high or t_medium. IMPORTANT: If you see "dish-image-placeholder" or just generic placeholder patterns in the URL, set image_url to null. If the img tag only has a placeholder src and a data-src attribute, use the data-src value)
          
          IMPORTANT RULES FOR IMAGES:
        1. Check img elements' src, data-src, and srcset attributes for actual image URLs
        2. Real iFood images contain paths like: /image/upload/t_medium/pratos/ or /image/upload/t_high/pratos/
        3. Placeholder URLs contain "dish-image-placeholder" - set these to null
        4. Prefer t_high > t_medium > t_low quality transforms
        5. If multiple sources available (src and data-src), prefer the one with higher quality
          
          Make sure to extract ALL products from ALL categories visible on the menu page.`,
        },
      waitFor: 10000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao acessar o cardápio do iFood' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the menu data from the extract response
    const menuData = scrapeData.data?.extract || scrapeData.extract;
  const htmlContent = scrapeData.data?.html || scrapeData.html || '';
    
    if (!menuData || !menuData.categories || menuData.categories.length === 0) {
      console.log('No menu data extracted, scrape result:', JSON.stringify(scrapeData).slice(0, 1000));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível extrair produtos do cardápio. Verifique se o link está correto.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Menu data extracted:', JSON.stringify(menuData).slice(0, 500));

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete existing products and categories for this restaurant
    console.log('Deleting existing products and categories...');
    
    await fetch(`${supabaseUrl}/rest/v1/products?restaurant_id=eq.${restaurant_id}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    await fetch(`${supabaseUrl}/rest/v1/categories?restaurant_id=eq.${restaurant_id}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Insert new categories
    const categoryMap: Record<string, string> = {};
    let categoryOrder = 0;

    for (const category of menuData.categories) {
      const categoryName = category.name || 'Sem categoria';
      
      const categoryResponse = await fetch(`${supabaseUrl}/rest/v1/categories`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          restaurant_id,
          name: categoryName,
          emoji: '🍽️',
          sort_order: categoryOrder++,
          active: true,
        }),
      });

      const categoryData = await categoryResponse.json();
      if (categoryData && categoryData[0]) {
        categoryMap[categoryName] = categoryData[0].id;
      }
    }

    // Insert new products
    let productCount = 0;
    let productOrder = 0;

    for (const category of menuData.categories) {
      const categoryName = category.name || 'Sem categoria';
      
      for (const product of (category.products || [])) {
        let price = typeof product.price === 'number' ? product.price : 0;
        
        // Parse price if it's a string
        if (typeof product.price === 'string') {
          const priceMatch = product.price.replace(/[^\d,\.]/g, '').replace(',', '.');
          price = parseFloat(priceMatch) || 0;
        }

        // Apply discount
        if (discount_percent > 0 && price > 0) {
          price = price * (1 - discount_percent / 100);
          price = Math.round(price * 100) / 100; // Round to 2 decimal places
        }

        // Filter out placeholder images
        let imageUrl = product.image_url || null;
        
        // If image_url is empty string or whitespace, set to null
        if (imageUrl && imageUrl.trim() === '') {
          imageUrl = null;
        }
        
        if (imageUrl) {
          const placeholderPatterns = [
            'dish-image-placeholder',
            'placeholder',
            'no-image',
            'default-image',
            'sem-imagem',
          ];
          const isPlaceholder = placeholderPatterns.some(pattern => 
            imageUrl.toLowerCase().includes(pattern)
          );
          if (isPlaceholder) {
            imageUrl = null;
            console.log(`Filtered placeholder image for product: ${product.name}`);
          }
        }
        
        // If still no valid image URL, try to extract from HTML as fallback
        if (!imageUrl && htmlContent) {
          // Try to find image in HTML by product name
          const productNamePattern = product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const imgRegex = new RegExp(`<img[^>]*alt=["']${productNamePattern}["'][^>]*src=["']([^"']+)["']`, 'i');
          const match = htmlContent.match(imgRegex);
          
          if (match && match[1] && !match[1].includes('placeholder')) {
            imageUrl = match[1];
            console.log(`Extracted image from HTML for product: ${product.name} -> ${imageUrl}`);
          }
        }

        const productData = {
          restaurant_id,
          name: product.name || 'Produto sem nome',
          description: product.description || null,
          price,
          image_url: imageUrl,
          category: categoryName,
          active: true,
          visible: true,
          sort_order: productOrder++,
        };

        const productResponse = await fetch(`${supabaseUrl}/rest/v1/products`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });

        if (productResponse.ok) {
          productCount++;
        } else {
          console.error('Error inserting product:', await productResponse.text());
        }
      }
    }

    console.log(`Successfully imported ${productCount} products`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        products_count: productCount,
        categories_count: Object.keys(categoryMap).length,
        message: `Cardápio clonado com sucesso! ${productCount} produtos importados.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in clone-ifood-menu:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao processar a clonagem' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
