const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

type FirecrawlAction =
  | { type: 'wait'; milliseconds: number; selector?: string }
  | { type: 'scroll'; direction: 'down' | 'up' }
  | { type: 'click'; selector: string }
  | { type: 'write'; text: string }
  | { type: 'press'; key: string }
  | { type: 'screenshot' };

type ScrapeWithRetryOptions = {
  onlyMainContent?: boolean;
  waitFor?: number;
  timeout?: number;
  actions?: FirecrawlAction[];
  mobile?: boolean;
};

// Firecrawl impõe limite de 50 actions por request.
// Mantemos uma margem para evitar falhas do tipo: "Number of actions cannot exceed 50".
const buildScrollActions = (scrolls = 22, maxActions = 48): FirecrawlAction[] => {
  // Estrutura fixa: 1 wait inicial + (scroll + wait)*N + 1 wait final
  const maxScrolls = Math.max(0, Math.floor((maxActions - 2) / 2));
  const safeScrolls = Math.min(scrolls, maxScrolls);

  const actions: FirecrawlAction[] = [{ type: 'wait', milliseconds: 2500 }];

  for (let i = 0; i < safeScrolls; i++) {
    actions.push({ type: 'scroll', direction: 'down' });
    // pequeno delay pra permitir lazy-load
    actions.push({ type: 'wait', milliseconds: 700 });
  }

  actions.push({ type: 'wait', milliseconds: 2500 });
  return actions;
};

const isValidIFoodImageUrl = (url: string) => {
  if (!url) return false;
  if (!url.startsWith('https://static.ifood-static.com.br')) return false;
  const lower = url.toLowerCase();
  if (lower.includes('placeholder') || lower.includes('no-image') || lower.includes('default') || lower.includes('avatar')) return false;
  return true;
};

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

    console.log('=== Iniciando extração PARALELA: estrutura + imagens ===');
    console.log('iFood URL:', ifoodUrl);

    // Helper function to scrape with retry
    const scrapeWithRetry = async (
      url: string,
      extractPrompt: string,
      label: string,
      options: ScrapeWithRetryOptions = {},
      maxRetries = 3,
    ): Promise<any> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[${label}] Attempt ${attempt}/${maxRetries}`);
        
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['extract'],
            timeout: options.timeout ?? 240000,
            onlyMainContent: options.onlyMainContent ?? true,
            extract: {
              prompt: extractPrompt,
            },
            waitFor: options.waitFor ?? 18000,
            actions: options.actions,
            mobile: options.mobile ?? false,
          }),
        });

        const data = await response.json();
        
        if (response.ok && data.success !== false) {
          console.log(`[${label}] Success!`);
          return { success: true, data };
        }
        
        console.log(`[${label}] Attempt ${attempt} failed:`, data?.error || data?.code || 'unknown');
        
        if (attempt < maxRetries) {
          const waitMs = 3000 * attempt;
          console.log(`[${label}] Waiting ${waitMs}ms before retry...`);
          await new Promise(r => setTimeout(r, waitMs));
        }
      }
      
      return { success: false, error: 'Timeout após múltiplas tentativas' };
    };

    // Define prompts
    const structurePrompt = `Extraia o cardápio COMPLETO desta página do iFood. Retorne JSON com:
- restaurant_name: string (nome do restaurante)
- categories: array com { name: string, products: array de { name: string, description: string ou null, price: number (converta "R$ 29,90" para 29.90) } }

IMPORTANTE:
- Extraia TODOS os produtos de TODAS as categorias visíveis na página
- NÃO inclua URLs de imagem nesta extração
- Foque apenas em: nome do produto, descrição e preço
- Faça scroll pela página inteira para capturar tudo`;

    const imagePrompt = `Extraia TODAS as imagens dos produtos desta página do iFood. Retorne JSON com:
- products: array de { name: string (nome EXATO do produto como aparece no cardápio), image_url: string (URL completa da imagem) }

REGRAS CRÍTICAS:
- Extraia APENAS URLs que começam com "https://static.ifood-static.com.br"
- O nome do produto deve ser IDÊNTICO ao que aparece no cardápio
- NÃO inclua URLs que contenham "placeholder", "no-image", "default" ou "avatar"
- Faça scroll pela página INTEIRA para capturar TODOS os produtos
- Cada produto deve ter seu nome e sua imagem correspondente`;

    console.log('Iniciando Promise.all para extração paralela...');
    
    // Run BOTH extractions in PARALLEL
    const [structureResult, imageResult] = await Promise.all([
      scrapeWithRetry(ifoodUrl, structurePrompt, 'ESTRUTURA', {
        onlyMainContent: true,
        actions: buildScrollActions(18),
        waitFor: 16000,
        timeout: 240000,
        mobile: true,
      }),
      scrapeWithRetry(ifoodUrl, imagePrompt, 'IMAGENS', {
        // imagens do iFood muitas vezes são lazy-loaded e fora do "main content"
        onlyMainContent: false,
        actions: buildScrollActions(28),
        waitFor: 22000,
        timeout: 270000,
        mobile: true,
      }),
    ]);

    console.log('Extração paralela finalizada!');
    console.log('Structure success:', structureResult.success);
    console.log('Images success:', imageResult.success);

    if (!structureResult.success) {
      console.error('Structure extraction failed');
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

    console.log('Categories extracted:', menuData.categories.length);

    // Build image map from parallel extraction
    const imageMap = new Map<string, string>();
    
    const normalizeForMap = (name: string): string => {
      return name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ');
    };

    if (imageResult.success) {
      const imageExtract = imageResult.data.data?.extract || imageResult.data.extract;
      const imageProducts = imageExtract?.products || [];
      console.log('Total images extracted:', imageProducts.length);
      
      for (const imgProduct of imageProducts) {
        if (imgProduct.name && imgProduct.image_url && isValidIFoodImageUrl(imgProduct.image_url)) {
          const normalizedName = normalizeForMap(imgProduct.name);
          imageMap.set(normalizedName, imgProduct.image_url);
          // Also store lowercase trim version for exact matching
          imageMap.set(imgProduct.name.toLowerCase().trim(), imgProduct.image_url);
        }
      }
      console.log('Image map entries:', imageMap.size);

      // Se a extração vier muito baixa, desabilitamos fuzzy matching para evitar "espalhar" 1-2 imagens em vários produtos.
      if (imageMap.size < 10) {
        console.log('Image map very small (<10). Fuzzy matching will be disabled to avoid wrong assignments.');
      }
    } else {
      console.log('Image extraction failed, products will be created without images');
    }

    // Function to find image for a product name
    const findImageUrl = (productName: string): string | null => {
      const normalized = normalizeForMap(productName);
      const lowercase = productName.toLowerCase().trim();
      
      // Try exact match
      if (imageMap.has(lowercase)) return imageMap.get(lowercase)!;
      if (imageMap.has(normalized)) return imageMap.get(normalized)!;

      // Se temos poucas imagens, não tente heurísticas amplas (isso causa 2 imagens virarem 50 produtos com a mesma foto)
      if (imageMap.size < 10) return null;
      
      // Try partial match
      for (const [key, url] of imageMap.entries()) {
        if (key.includes(normalized) || normalized.includes(key)) {
          return url;
        }
      }
      
      // Try word-based match
      const words = normalized.split(' ').filter(w => w.length > 2);
      for (const [key, url] of imageMap.entries()) {
        const keyWords = key.split(' ').filter(w => w.length > 2);
        const commonWords = words.filter(w => keyWords.includes(w));
        if (commonWords.length >= 2 || (commonWords.length >= 1 && keyWords.length <= 2)) {
          return url;
        }
      }
      
      return null;
    };

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

    // Insert categories and products WITH images from parallel extraction
    const categoryMap: Record<string, string> = {};
    let categoryOrder = 0;
    let productCount = 0;
    let productOrder = 0;
    let imagesCount = 0;

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

        // Find image from the parallel extraction
        const productName = product.name || 'Produto sem nome';
        const imageUrl = findImageUrl(productName);
        
        if (imageUrl) {
          imagesCount++;
        }

        const productData = {
          restaurant_id,
          name: productName,
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
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(productData),
        });

        if (productResponse.ok) {
          productCount++;
        } else {
          console.error('Error inserting product:', productName, await productResponse.text());
        }
      }
    }

    console.log(`=== CLONAGEM FINALIZADA ===`);
    console.log(`Produtos: ${productCount}`);
    console.log(`Com imagem: ${imagesCount}`);
    console.log(`Categorias: ${Object.keys(categoryMap).length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        products_count: productCount,
        images_count: imagesCount,
        categories_count: Object.keys(categoryMap).length,
        message: `Cardápio clonado com sucesso! ${productCount} produtos importados, ${imagesCount} com imagem.`
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
