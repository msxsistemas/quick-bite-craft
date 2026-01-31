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

    console.log('=== Iniciando extração do cardápio ===');
    console.log('iFood URL:', ifoodUrl);

    // Single extraction with both structure and images
    const extractPrompt = `Extraia o cardápio COMPLETO desta página do iFood. Retorne um JSON com:

{
  "restaurant_name": "nome do restaurante",
  "categories": [
    {
      "name": "nome da categoria",
      "products": [
        {
          "name": "nome exato do produto",
          "description": "descrição do produto ou null",
          "price": 29.90,
          "image_url": "URL completa da imagem ou null"
        }
      ]
    }
  ]
}

REGRAS IMPORTANTES:
1. Extraia TODOS os produtos de TODAS as categorias
2. Faça scroll pela página INTEIRA para capturar tudo
3. O preço deve ser número (converta "R$ 29,90" para 29.90)
4. Para image_url: capture a URL que começa com "https://static.ifood-static.com.br"
5. Se não encontrar imagem do produto, use null
6. O nome do produto deve ser EXATAMENTE como aparece no cardápio
7. Inclua a descrição completa de cada produto`;

    console.log('Iniciando extração única com estrutura + imagens...');

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: ifoodUrl,
        formats: ['extract'],
        timeout: 180000,
        onlyMainContent: true,
        extract: {
          prompt: extractPrompt,
        },
        waitFor: 15000, // Wait longer for images to load
      }),
    });

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeResponse.ok || scrapeData.success === false) {
      console.error('Scrape failed:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao extrair cardápio. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const menuData = scrapeData.data?.extract || scrapeData.extract;
    
    if (!menuData || !menuData.categories || menuData.categories.length === 0) {
      console.log('No menu data extracted:', JSON.stringify(scrapeData).slice(0, 1000));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível extrair produtos do cardápio. Verifique se o link está correto.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Categories extracted:', menuData.categories.length);
    
    // Count products and images
    let totalProducts = 0;
    let productsWithImages = 0;
    for (const cat of menuData.categories) {
      for (const prod of (cat.products || [])) {
        totalProducts++;
        if (prod.image_url && prod.image_url.startsWith('https://')) {
          productsWithImages++;
        }
      }
    }
    console.log('Total products:', totalProducts);
    console.log('Products with images:', productsWithImages);

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

    // Create categories first and get their IDs
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

    console.log('Categories created:', Object.keys(categoryMap).length);

    // Prepare all products for batch insert
    const allProducts: any[] = [];
    let productOrder = 0;
    let imagesCount = 0;

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

        const productName = product.name || 'Produto sem nome';
        let imageUrl = null;
        
        // Validate and use image URL directly from extraction
        if (product.image_url && 
            typeof product.image_url === 'string' && 
            product.image_url.startsWith('https://')) {
          imageUrl = product.image_url;
          imagesCount++;
        }

        allProducts.push({
          restaurant_id,
          name: productName,
          description: product.description || null,
          price,
          image_url: imageUrl,
          category: categoryName,
          active: true,
          visible: true,
          sort_order: productOrder++,
        });
      }
    }

    // Batch insert products (in chunks of 50 for reliability)
    const BATCH_SIZE = 50;
    let insertedCount = 0;

    for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
      const batch = allProducts.slice(i, i + BATCH_SIZE);
      
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/products`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(batch),
      });

      if (insertResponse.ok) {
        insertedCount += batch.length;
        console.log(`Batch inserted: ${insertedCount}/${allProducts.length}`);
      } else {
        const errorText = await insertResponse.text();
        console.error('Batch insert error:', errorText);
      }
    }

    console.log(`=== CLONAGEM FINALIZADA ===`);
    console.log(`Produtos: ${insertedCount}`);
    console.log(`Com imagem: ${imagesCount}`);
    console.log(`Categorias: ${Object.keys(categoryMap).length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        products_count: insertedCount,
        images_count: imagesCount,
        categories_count: Object.keys(categoryMap).length,
        message: `Cardápio clonado com sucesso! ${insertedCount} produtos importados, ${imagesCount} com imagem.`
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
