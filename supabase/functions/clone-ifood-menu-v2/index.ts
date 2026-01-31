import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.90.1';

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
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const allowed =
      host.endsWith('ifood-static.com.br') ||
      host.endsWith('ifood.com.br') ||
      host.includes('ifood');
    if (!allowed) return false;

    const lower = url.toLowerCase();
    if (lower.includes('placeholder') || lower.includes('no-image') || lower.includes('default') || lower.includes('avatar')) return false;

    // Na prática, as imagens de pratos costumam passar por /image/upload/
    // (mantemos flexível porque o iFood pode variar o caminho)
    return true;
  } catch {
    return false;
  }
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

    console.log('=== Iniciando extração do cardápio (estrutura + imagens) ===');
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

    const scrapeHtmlWithRetry = async (
      url: string,
      label: string,
      options: ScrapeWithRetryOptions = {},
      maxRetries = 2,
    ): Promise<{ success: boolean; html?: string; error?: string }> => {
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
            formats: ['html'],
            timeout: options.timeout ?? 240000,
            onlyMainContent: options.onlyMainContent ?? false,
            waitFor: options.waitFor ?? 18000,
            actions: options.actions,
            mobile: options.mobile ?? false,
          }),
        });

        const data = await response.json();
        const html = data?.data?.html || data?.html;

        if (response.ok && typeof html === 'string' && html.trim().length > 0) {
          console.log(`[${label}] Success!`);
          return { success: true, html };
        }

        console.log(`[${label}] Attempt ${attempt} failed:`, data?.error || data?.code || 'unknown');

        if (attempt < maxRetries) {
          const waitMs = 3000 * attempt;
          console.log(`[${label}] Waiting ${waitMs}ms before retry...`);
          await new Promise(r => setTimeout(r, waitMs));
        }
      }

      return { success: false, error: 'Falha ao obter HTML após múltiplas tentativas' };
    };

    const normalizeForMap = (name: string): string => {
      const normalized = name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ');

      // remove “badges” que às vezes aparecem colados no nome
      return normalized
        .replace(/\b(mais pedido|mais pedidos|novo|novidade|promocao|promo|oferta)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const extractProductImagePairsFromHtml = (html: string): Array<{ name: string; image_url: string }> => {
      const pairs: Array<{ name: string; image_url: string }> = [];

      // captura tags <img ...> e tenta extrair alt + src/data-src/srcset
      const imgTagRegex = /<img\b[^>]*>/gi;
      const tags = html.match(imgTagRegex) || [];

      const getAttr = (tag: string, attr: string) => {
        const re = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'i');
        return re.exec(tag)?.[1] || null;
      };

      const pickFromSrcset = (srcset: string) => {
        // formato típico: "url1 1x, url2 2x" -> escolhe a última (geralmente melhor)
        const parts = srcset.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length === 0) return null;
        const last = parts[parts.length - 1];
        return last.split(' ')[0] || null;
      };

      for (const tag of tags) {
        const alt = getAttr(tag, 'alt') || getAttr(tag, 'aria-label');
        if (!alt || alt.trim().length < 2) continue;

        const srcset = getAttr(tag, 'srcset');
        const src = getAttr(tag, 'src') || getAttr(tag, 'data-src') || getAttr(tag, 'data-lazy-src') || getAttr(tag, 'data-original');
        const url = (srcset ? pickFromSrcset(srcset) : null) || src;
        if (!url) continue;

        // iFood às vezes devolve URLs relativas
        const resolved = url.startsWith('http') ? url : `https:${url}`;
        if (!isValidIFoodImageUrl(resolved)) continue;

        pairs.push({ name: alt.trim(), image_url: resolved });
      }

      return pairs;
    };

    // Prompt único (mais rápido) tentando trazer tudo de uma vez
    const menuPrompt = `Extraia o cardápio COMPLETO desta página do iFood. Retorne JSON com:
 - restaurant_name: string
 - categories: array com { name: string, products: array de { name: string, description: string ou null, price: number (converta "R$ 29,90" para 29.90), image_url: string ou null } }

REGRAS IMPORTANTES:
 - Extraia TODOS os produtos de TODAS as categorias visíveis na página
 - Para image_url: use a URL COMPLETA da imagem do produto (se houver)
 - NÃO inclua URLs que contenham "placeholder", "no-image", "default" ou "avatar"
 - Faça scroll pela página inteira para capturar tudo`;

    const menuResult = await scrapeWithRetry(ifoodUrl, menuPrompt, 'MENU', {
      onlyMainContent: false,
      actions: buildScrollActions(26),
      waitFor: 14000,
      timeout: 200000,
      mobile: true,
    }, 2);

    console.log('Extração do menu finalizada!');
    console.log('Menu success:', menuResult.success);

    if (!menuResult.success) {
      console.error('Menu extraction failed');
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao extrair cardápio. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const menuScrapeData = menuResult.data;
    const menuData = menuScrapeData.data?.extract || menuScrapeData.extract;
    
    if (!menuData || !menuData.categories || menuData.categories.length === 0) {
      console.log('No menu data extracted:', JSON.stringify(menuScrapeData).slice(0, 1000));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível extrair produtos do cardápio. Verifique se o link está correto.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Categories extracted:', menuData.categories.length);

    // Conta quantas imagens já vieram do prompt
    let totalProducts = 0;
    let validImagesFromPrompt = 0;
    for (const category of menuData.categories) {
      for (const product of (category.products || [])) {
        totalProducts++;
        if (product?.image_url && typeof product.image_url === 'string' && isValidIFoodImageUrl(product.image_url)) {
          validImagesFromPrompt++;
        }
      }
    }

    console.log('Total products extracted:', totalProducts);
    console.log('Valid images from prompt:', validImagesFromPrompt);

    // Fallback via HTML (alt+src), só quando o prompt traz poucas imagens
    const imageMap = new Map<string, string>();
    if (validImagesFromPrompt < 10) {
      console.log('Few images from prompt. Trying HTML fallback to recover more images...');

      const htmlResult = await scrapeHtmlWithRetry(ifoodUrl, 'IMAGENS_HTML', {
        onlyMainContent: false,
        actions: buildScrollActions(26),
        waitFor: 14000,
        timeout: 200000,
        mobile: true,
      }, 2);

      if (htmlResult.success && htmlResult.html) {
        const pairs = extractProductImagePairsFromHtml(htmlResult.html);
        console.log('HTML img pairs found:', pairs.length);

        for (const p of pairs) {
          if (!p.name || !p.image_url) continue;
          const n = normalizeForMap(p.name);
          if (n) imageMap.set(n, p.image_url);
          imageMap.set(p.name.toLowerCase().trim(), p.image_url);
        }

        console.log('Image map entries from HTML:', imageMap.size);
        if (imageMap.size < 10) {
          console.log('Image map very small (<10). Only strict matching will be used to avoid wrong assignments.');
        }
      } else {
        console.log('HTML fallback failed:', htmlResult.error);
      }
    }

    // Function to find image for a product name
    const strictIncludesMatch = (a: string, b: string) => {
      if (!a || !b) return false;
      if (a === b) return true;
      const [longer, shorter] = a.length >= b.length ? [a, b] : [b, a];
      if (shorter.length < 8) return false;
      if (!longer.includes(shorter)) return false;
      const diff = Math.abs(longer.length - shorter.length);
      return diff <= Math.max(6, Math.floor(shorter.length * 0.25));
    };

    const findImageUrl = (productName: string): string | null => {
      const normalized = normalizeForMap(productName);
      const lowercase = productName.toLowerCase().trim();
      
      // Try exact match
      if (imageMap.has(lowercase)) return imageMap.get(lowercase)!;
      if (imageMap.has(normalized)) return imageMap.get(normalized)!;

      // Se temos poucas imagens, ainda permitimos um "includes" bem estrito (pra cobrir pequenas variações do nome)
      if (imageMap.size < 10) {
        for (const [key, url] of imageMap.entries()) {
          if (strictIncludesMatch(key, normalized) || strictIncludesMatch(normalized, key)) return url;
        }
        return null;
      }
      
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

    // Database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    console.log('Deleting existing products and categories...');
    {
      const { error: delProductsErr } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('restaurant_id', restaurant_id);
      if (delProductsErr) console.error('Delete products error:', delProductsErr);

      const { error: delCategoriesErr } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('restaurant_id', restaurant_id);
      if (delCategoriesErr) console.error('Delete categories error:', delCategoriesErr);
    }

    // Insert categories in batch
    const categoriesToInsert = (menuData.categories || []).map((category: any, idx: number) => ({
      restaurant_id,
      name: (category?.name || 'Sem categoria') as string,
      emoji: '🍽️',
      sort_order: idx,
      active: true,
    }));

    const categoryMap: Record<string, string> = {};
    const { data: insertedCategories, error: catInsertErr } = await supabaseAdmin
      .from('categories')
      .insert(categoriesToInsert)
      .select('id,name');

    if (catInsertErr) {
      console.error('Insert categories error:', catInsertErr);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao salvar categorias no banco' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const c of insertedCategories || []) {
      categoryMap[c.name] = c.id;
    }

    console.log('Categories created:', Object.keys(categoryMap).length);

    // Build products list
    const productsToInsert: any[] = [];
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
        const imageUrl = findImageUrl(productName);
        if (imageUrl) imagesCount++;

        productsToInsert.push({
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

    console.log('Total products to insert:', productsToInsert.length);

    // Insert products in chunks (faster, less chance of timeout)
    let productCount = 0;
    const chunkSize = 200;
    for (let i = 0; i < productsToInsert.length; i += chunkSize) {
      const chunk = productsToInsert.slice(i, i + chunkSize);
      const { error: prodInsertErr } = await supabaseAdmin
        .from('products')
        .insert(chunk);

      if (prodInsertErr) {
        console.error('Insert products chunk error:', prodInsertErr);
      } else {
        productCount += chunk.length;
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
