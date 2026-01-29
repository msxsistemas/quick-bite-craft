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
      const cleanCnpj = cnpj.replace(/\D/g, '');
      
      if (cleanCnpj.length !== 14) {
        return new Response(
          JSON.stringify({ success: false, error: 'CNPJ inválido. Deve conter 14 dígitos.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Searching iFood for CNPJ:', cleanCnpj);

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

      const ifoodResults = searchData.data?.filter((result: any) => 
        result.url && result.url.includes('ifood.com.br/delivery/')
      ) || [];

      if (ifoodResults.length === 0) {
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

    if (!ifoodUrl.startsWith('http://') && !ifoodUrl.startsWith('https://')) {
      ifoodUrl = `https://${ifoodUrl}`;
    }

    console.log('=== ETAPA 1: Clonando estrutura do cardápio (sem imagens) ===');
    console.log('iFood URL:', ifoodUrl);

    // Helper function to scrape with retry
    const scrapeWithRetry = async (url: string, extractPrompt: string, maxRetries = 2): Promise<any> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`Scrape attempt ${attempt}/${maxRetries}`);
        
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['extract'],
            timeout: 180000,
            onlyMainContent: true,
            extract: {
              prompt: extractPrompt,
            },
            waitFor: 8000,
          }),
        });

        const data = await response.json();
        
        if (response.ok && data.success !== false) {
          return { success: true, data };
        }
        
        console.log(`Attempt ${attempt} failed:`, data.error || data.code);
        
        if (attempt < maxRetries) {
          console.log('Waiting 3s before retry...');
          await new Promise(r => setTimeout(r, 3000));
        }
      }
      
      return { success: false, error: 'Timeout após múltiplas tentativas' };
    };

    // STEP 1: Extract menu structure (no images)
    const structureResult = await scrapeWithRetry(
      ifoodUrl,
      `Extraia o cardápio desta página do iFood. Retorne JSON com:
- restaurant_name: string (nome do restaurante)
- categories: array com { name: string, products: array de { name: string, description: string ou null, price: number (converta "R$ 29,90" para 29.90) } }

NÃO inclua URLs de imagem nesta extração. Foque apenas em: nome do produto, descrição e preço.
Extraia TODOS os produtos de TODAS as categorias visíveis.`
    );

    if (!structureResult.success) {
      console.error('Structure extraction failed after retries');
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao extrair estrutura do cardápio. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const structureData = structureResult.data;

    const menuData = structureData.data?.extract || structureData.extract;
    
    if (!menuData || !menuData.categories || menuData.categories.length === 0) {
      console.log('No menu data extracted:', JSON.stringify(structureData).slice(0, 1000));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível extrair produtos do cardápio. Verifique se o link está correto.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Structure extracted:', menuData.categories.length, 'categories');

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete existing products and categories
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

    // Insert categories and products (without images)
    const categoryMap: Record<string, string> = {};
    let categoryOrder = 0;
    const insertedProducts: { id: string; name: string; category: string }[] = [];

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

    let productCount = 0;
    let productOrder = 0;

    for (const category of menuData.categories) {
      const categoryName = category.name || 'Sem categoria';
      
      for (const product of (category.products || [])) {
        let price = typeof product.price === 'number' ? product.price : 0;
        
        if (typeof product.price === 'string') {
          const priceMatch = product.price.replace(/[^\d,\.]/g, '').replace(',', '.');
          price = parseFloat(priceMatch) || 0;
        }

        if (discount_percent > 0 && price > 0) {
          price = price * (1 - discount_percent / 100);
          price = Math.round(price * 100) / 100;
        }

        const productData = {
          restaurant_id,
          name: product.name || 'Produto sem nome',
          description: product.description || null,
          price,
          image_url: null, // No image in step 1
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
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(productData),
        });

        if (productResponse.ok) {
          const insertedProduct = await productResponse.json();
          if (insertedProduct && insertedProduct[0]) {
            insertedProducts.push({
              id: insertedProduct[0].id,
              name: product.name,
              category: categoryName,
            });
          }
          productCount++;
        } else {
          console.error('Error inserting product:', await productResponse.text());
        }
      }
    }

    console.log(`Step 1 complete: ${productCount} products inserted without images`);

    // STEP 2: Extract and update images
    console.log('=== ETAPA 2: Extraindo imagens ===');

    const imageResult = await scrapeWithRetry(
      ifoodUrl,
      `Extraia APENAS as imagens dos produtos desta página do iFood. Retorne JSON com:
- products: array de { name: string (nome exato do produto), image_url: string (URL completa da imagem) }

IMPORTANTE:
- Extraia APENAS URLs de imagens que começam com "https://static.ifood-static.com.br"
- O nome do produto deve corresponder EXATAMENTE ao nome exibido no cardápio
- NÃO inclua URLs que contenham "placeholder", "no-image" ou "default"
- Extraia o máximo de imagens possível de TODOS os produtos visíveis`
    );

    let imagesUpdated = 0;

    // Helper function for fuzzy name matching
    const normalizeProductName = (name: string): string => {
      return name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, ' '); // Normalize spaces
    };

    const findBestMatch = (imageName: string, products: typeof insertedProducts): typeof insertedProducts[0] | null => {
      const normalizedImageName = normalizeProductName(imageName);
      
      // Try exact match first
      let match = products.find(p => normalizeProductName(p.name) === normalizedImageName);
      if (match) return match;
      
      // Try contains match (image name contains product name or vice versa)
      match = products.find(p => {
        const normalizedProductName = normalizeProductName(p.name);
        return normalizedImageName.includes(normalizedProductName) || 
               normalizedProductName.includes(normalizedImageName);
      });
      if (match) return match;

      // Try word-based matching (at least 2 words in common)
      const imageWords = normalizedImageName.split(' ').filter(w => w.length > 2);
      match = products.find(p => {
        const productWords = normalizeProductName(p.name).split(' ').filter(w => w.length > 2);
        const commonWords = imageWords.filter(w => productWords.includes(w));
        return commonWords.length >= 2 || (commonWords.length >= 1 && productWords.length <= 2);
      });
      
      return match || null;
    };

    if (imageResult.success) {
      const imageExtract = imageResult.data.data?.extract || imageResult.data.extract;
      
      console.log('Images extracted:', JSON.stringify(imageExtract).slice(0, 500));

      if (imageExtract?.products && Array.isArray(imageExtract.products)) {
        const matchedProductIds = new Set<string>();
        
        for (const imgProduct of imageExtract.products) {
          if (!imgProduct.image_url || !imgProduct.name) continue;
          
          // Validate image URL
          const imageUrl = imgProduct.image_url;
          if (!imageUrl.startsWith('https://')) continue;

          // Find matching product using fuzzy matching
          const matchingProduct = findBestMatch(imgProduct.name, insertedProducts);

          if (matchingProduct && !matchedProductIds.has(matchingProduct.id)) {
            matchedProductIds.add(matchingProduct.id);
            
            const updateResponse = await fetch(
              `${supabaseUrl}/rest/v1/products?id=eq.${matchingProduct.id}`,
              {
                method: 'PATCH',
                headers: {
                  'apikey': supabaseServiceKey,
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image_url: imageUrl }),
              }
            );

            if (updateResponse.ok) {
              imagesUpdated++;
              console.log(`Updated image for: ${matchingProduct.name} (matched from: ${imgProduct.name})`);
            }
          }
        }
        
        // Log unmatched products for debugging
        const unmatchedProducts = insertedProducts.filter(p => !matchedProductIds.has(p.id));
        if (unmatchedProducts.length > 0) {
          console.log(`Products without images (${unmatchedProducts.length}):`, 
            unmatchedProducts.slice(0, 10).map(p => p.name).join(', '));
        }
      }
    } else {
      console.log('Image extraction failed, continuing without images');
    }

    console.log(`Step 2 complete: ${imagesUpdated} images updated`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        products_count: productCount,
        images_count: imagesUpdated,
        categories_count: Object.keys(categoryMap).length,
        message: `Cardápio clonado com sucesso! ${productCount} produtos importados, ${imagesUpdated} imagens.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in clone-ifood-menu-v2:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao processar a clonagem' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
