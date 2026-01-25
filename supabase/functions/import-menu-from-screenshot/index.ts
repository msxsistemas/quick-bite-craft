 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 interface RequestBody {
   restaurant_id: string;
   image_data: string; // base64
   discount_percent?: number;
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const body: RequestBody = await req.json();
     const { restaurant_id, image_data, discount_percent = 0 } = body;
 
     if (!restaurant_id || !image_data) {
       return new Response(
         JSON.stringify({ success: false, error: 'restaurant_id e image_data são obrigatórios' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
     if (!lovableApiKey) {
       console.error('LOVABLE_API_KEY not configured');
       return new Response(
         JSON.stringify({ success: false, error: 'Serviço de IA não configurado' }),
         { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     console.log('Analyzing menu screenshot with AI...');
 
     // Use Lovable AI to extract menu data from screenshot
     const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${lovableApiKey}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         model: 'google/gemini-2.5-flash',
         messages: [{
           role: 'user',
           content: [
             {
               type: 'text',
               text: `Analise esta imagem de cardápio do iFood e extraia TODOS os produtos visíveis.
 
 Retorne APENAS um objeto JSON válido (sem markdown, sem explicações) neste formato exato:
 {
   "categories": [
     {
       "name": "Nome da Categoria",
       "products": [
         {
           "name": "Nome do Produto",
           "description": "Descrição ou null",
           "price": 29.90
         }
       ]
     }
   ]
 }
 
 IMPORTANTE:
 - Extraia TODOS os produtos visíveis na imagem
 - Converta preços de "R$ 29,90" para 29.90 (número decimal)
 - Use null se não houver descrição
 - Retorne APENAS o JSON, sem texto adicional`
             },
             {
               type: 'image_url',
               image_url: { url: image_data }
             }
           ]
         }],
         temperature: 0.1,
       }),
     });
 
     if (!aiResponse.ok) {
       const errorData = await aiResponse.json();
       console.error('AI API error:', errorData);
       return new Response(
         JSON.stringify({ success: false, error: 'Erro ao processar imagem com IA' }),
         { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const aiData = await aiResponse.json();
     const content = aiData.choices?.[0]?.message?.content;
 
     if (!content) {
       console.error('No content in AI response');
       return new Response(
         JSON.stringify({ success: false, error: 'IA não retornou dados' }),
         { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Extract JSON from response (remove markdown if present)
     let menuData;
     try {
       const jsonMatch = content.match(/\{[\s\S]*\}/);
       if (!jsonMatch) {
         throw new Error('No JSON found in response');
       }
       menuData = JSON.parse(jsonMatch[0]);
     } catch (parseError) {
       console.error('Failed to parse AI response:', content);
       return new Response(
         JSON.stringify({ success: false, error: 'Erro ao processar resposta da IA' }),
         { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     if (!menuData.categories || menuData.categories.length === 0) {
       return new Response(
         JSON.stringify({ success: false, error: 'Nenhum produto encontrado na imagem' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     console.log(`Extracted ${menuData.categories.length} categories from screenshot`);
 
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
           price = Math.round(price * 100) / 100;
         }
 
         const productData = {
           restaurant_id,
           name: product.name || 'Produto sem nome',
           description: product.description || null,
           price,
           image_url: null,
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
         }
       }
     }
 
     console.log(`Successfully imported ${productCount} products`);
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         products_count: productCount,
         categories_count: Object.keys(categoryMap).length,
         message: `Cardápio importado com sucesso! ${productCount} produtos importados.`
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
 
   } catch (error) {
     console.error('Error in import-menu-from-screenshot:', error);
     return new Response(
       JSON.stringify({ 
         success: false, 
         error: error instanceof Error ? error.message : 'Erro ao processar importação' 
       }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });