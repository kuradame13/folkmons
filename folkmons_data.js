// Folkmons - Baseados no Folclore Brasileiro
// 50 monstros principais + starters + evoluções

const FOLKMONS = {
    // STARTERS - Escolha entre 3
    starters: [
        { id: "START_AGUA", name: "Iarinha", element: "Agua", folklore: "Iara", sprite: "🧜", desc: "Filhote da Iara, atraente e ágil nas águas", baseHp: 45, baseAtk: 11, baseDef: 10, rarity: "starter" },
        { id: "START_GRAMA", name: "Caiporinha", element: "Grama", folklore: "Caipora", sprite: "🌿", desc: "Pequena guardiã das matas brasileiras", baseHp: 48, baseAtk: 12, baseDef: 11, rarity: "starter" },
        { id: "START_FOGO", name: "Saci-Embrião", element: "Fogo", folklore: "Saci-Pererê", sprite: "💨", desc: "Saci ainda aprendiz, com sua carapuça fumegante", baseHp: 42, baseAtk: 14, baseDef: 8, rarity: "starter" }
    ],
    
    // 50 FOLKMONS PRINCIPAIS
    main: [
        // 1-10 EVOLUEM POR ITEM (10 monstros)
        { id: "FM001", name: "Mandingueiro", element: "Trevas", folklore: "Feiticeiro do Sertão", sprite: "🧙", baseHp: 38, baseAtk: 16, baseDef: 9, evoType: "item", evoItem: "amuleto_mistico", evoTo: ["FM001A"], evoCount: 2, rarity: "comum" },
        { id: "FM001A", name: "Bruxo Sertanejo", element: "Trevas", folklore: "Curandeiro Maligno", sprite: "🧙‍♂️", baseHp: 62, baseAtk: 24, baseDef: 14, evoType: "item", evoItem: "grimorio_antigo", evoTo: ["FM001B"], evoCount: 2 },
        { id: "FM001B", name: "Pai-de-Santo das Sombras", element: "Trevas", folklore: "Malandro Espiritual", sprite: "👤", baseHp: 88, baseAtk: 32, baseDef: 20, evoType: "none", evoCount: 2 },
        
        { id: "FM002", name: "Cobra-Encantada", element: "Agua", folklore: "Boitatá Filhote", sprite: "🐍", baseHp: 44, baseAtk: 13, baseDef: 12, evoType: "item", evoItem: "escama_luminosa", evoTo: ["FM002A"], evoCount: 2 },
        { id: "FM002A", name: "Serpente Fogo-d'Água", element: "Agua", folklore: "Boitatá Júnior", sprite: "🐉", baseHp: 68, baseAtk: 19, baseDef: 18, evoType: "item", evoItem: "cristal_vapor", evoTo: ["FM002B"], evoCount: 2 },
        { id: "FM002B", name: "Boitatá", element: "Fogo/Agua", folklore: "Boitatá", sprite: "🔥🐍", baseHp: 96, baseAtk: 28, baseDef: 26, evoType: "none", evoCount: 2 },
        
        { id: "FM003", name: "Lobo-Cão", element: "Trevas", folklore: "Lobisomem Filhote", sprite: "🐺", baseHp: 47, baseAtk: 15, baseDef: 11, evoType: "item", evoItem: "lua_prata", evoTo: ["FM003A"], evoCount: 2 },
        { id: "FM003A", name: "Lobisomem", element: "Trevas", folklore: "Lobisomem", sprite: "🐺", baseHp: 74, baseAtk: 23, baseDef: 16, evoType: "item", evoItem: "dente_lunatico", evoTo: ["FM003B"], evoCount: 2 },
        { id: "FM003B", name: "Alfa-Lobisomem", element: "Trevas", folklore: "Lobisomem Ancião", sprite: "🐺👹", baseHp: 102, baseAtk: 31, baseDef: 22, evoType: "none", evoCount: 2 },
        
        { id: "FM004", name: "Caboclinho", element: "Grama", folklore: "Curupira Filhote", sprite: "🧒", baseHp: 49, baseAtk: 12, baseDef: 13, evoType: "item", evoItem: "semente_sagrada", evoTo: ["FM004A"], evoCount: 2 },
        { id: "FM004A", name: "Curupira", element: "Grama", folklore: "Curupira", sprite: "🧝", baseHp: 76, baseAtk: 18, baseDef: 19, evoType: "item", evoItem: "raiz_protetora", evoTo: ["FM004B"], evoCount: 2 },
        { id: "FM004B", name: "Guardião da Floresta", element: "Grama", folklore: "Curupira Ancião", sprite: "🧙🌲", baseHp: 104, baseAtk: 25, baseDef: 28, evoType: "none", evoCount: 2 },
        
        { id: "FM005", name: "Ossinho", element: "Trevas", folklore: "Mula Sem Cabeça Filhote", sprite: "🦴", baseHp: 43, baseAtk: 17, baseDef: 10, evoType: "item", evoItem: "ferradura_fantasma", evoTo: ["FM005A"], evoCount: 2 },
        { id: "FM005A", name: "Mula Flamejante", element: "Fogo/Trevas", folklore: "Mula Sem Cabeça", sprite: "🐎🔥", baseHp: 70, baseAtk: 26, baseDef: 15, evoType: "item", evoItem: "chama_eterea", evoTo: ["FM005B"], evoCount: 2 },
        { id: "FM005B", name: "Mula Sem Cabeça", element: "Fogo/Trevas", folklore: "Mula Sem Cabeça", sprite: "🐎👻🔥", baseHp: 98, baseAtk: 35, baseDef: 21, evoType: "none", evoCount: 2 },
        
        { id: "FM006", name: "Peixe-Lenda", element: "Agua", folklore: "Iara Filhote", sprite: "🐠", baseHp: 46, baseAtk: 14, baseDef: 11, evoType: "item", evoItem: "concha_perolada", evoTo: ["FM006A"], evoCount: 2 },
        { id: "FM006A", name: "Sereia-d'Água", element: "Agua", folklore: "Iara", sprite: "🧜‍♀️", baseHp: 73, baseAtk: 21, baseDef: 17, evoType: "item", evoItem: "lagrima_venus", evoTo: ["FM006B"], evoCount: 2 },
        { id: "FM006B", name: "Iara Rainha", element: "Agua", folklore: "Iara", sprite: "🧜‍♀️👑", baseHp: 101, baseAtk: 29, baseDef: 24, evoType: "none", evoCount: 2 },
        
        { id: "FM007", name: "Carapinha", element: "Fogo", folklore: "Saci Filhote", sprite: "👦", baseHp: 41, baseAtk: 16, baseDef: 9, evoType: "item", evoItem: "penca_fumo", evoTo: ["FM007A"], evoCount: 2 },
        { id: "FM007A", name: "Saci-Pererê", element: "Fogo", folklore: "Saci-Pererê", sprite: "🧒💨", baseHp: 67, baseAtk: 25, baseDef: 14, evoType: "item", evoItem: "carapuca_magica", evoTo: ["FM007B"], evoCount: 2 },
        { id: "FM007B", name: "Saci-Mestre", element: "Fogo", folklore: "Saci-Pererê", sprite: "🧙💨", baseHp: 94, baseAtk: 34, baseDef: 19, evoType: "none", evoCount: 2 },
        
        { id: "FM008", name: "Jibóia-Verde", element: "Grama", folklore: "Cobra Grande Filhote", sprite: "🐍", baseHp: 50, baseAtk: 13, baseDef: 14, evoType: "item", evoItem: "folha_milenar", evoTo: ["FM008A"], evoCount: 2 },
        { id: "FM008A", name: "Cobra-Flor", element: "Grama", folklore: "Cobra Encantada", sprite: "🐍🌿", baseHp: 77, baseAtk: 19, baseDef: 20, evoType: "item", evoItem: "nectar_animal", evoTo: ["FM008B"], evoCount: 2 },
        { id: "FM008B", name: "Cuca-Jibóia", element: "Grama", folklore: "Cuca", sprite: "🐊🌿", baseHp: 105, baseAtk: 26, baseDef: 29, evoType: "none", evoCount: 2 },
        
        { id: "FM009", name: "Vagalume-Assombrado", element: "Eletrico", folklore: "Pisadeira Filhote", sprite: "✨", baseHp: 39, baseAtk: 15, baseDef: 10, evoType: "item", evoItem: "poeira_estelar", evoTo: ["FM009A"], evoCount: 2 },
        { id: "FM009A", name: "Pisadeira", element: "Eletrico/Trevas", folklore: "Pisadeira", sprite: "👻", baseHp: 65, baseAtk: 23, baseDef: 15, evoType: "item", evoItem: "alma_vaga", evoTo: ["FM009B"], evoCount: 2 },
        { id: "FM009B", name: "Pisadeira Noturna", element: "Eletrico/Trevas", folklore: "Pisadeira", sprite: "👻⚡", baseHp: 92, baseAtk: 32, baseDef: 21, evoType: "none", evoCount: 2 },
        
        { id: "FM010", name: "Pássaro-Guia", element: "Vento", folklore: "Anhangá Filhote", sprite: "🦅", baseHp: 44, baseAtk: 17, baseDef: 12, evoType: "item", evoItem: "pena_celestial", evoTo: ["FM010A"], evoCount: 2 },
        { id: "FM010A", name: "Anhangá", element: "Vento", folklore: "Anhangá", sprite: "🦅👻", baseHp: 71, baseAtk: 26, baseDef: 17, evoType: "item", evoItem: "vento_errante", evoTo: ["FM010B"], evoCount: 2 },
        { id: "FM010B", name: "Anhangá Protetor", element: "Vento/Trevas", folklore: "Anhangá", sprite: "🦅✨", baseHp: 99, baseAtk: 35, baseDef: 23, evoType: "none", evoCount: 2 },
        
        // 11-20 EVOLUEM POR TROCA (10 monstros)
        { id: "FM011", name: "Galo-Fantasma", element: "Fogo", folklore: "Alma Penada", sprite: "🐓", baseHp: 42, baseAtk: 15, baseDef: 11, evoType: "trade", tradeWith: "FM012", evoTo: ["FM011A"], evoCount: 2 },
        { id: "FM011A", name: "Galo das Almas", element: "Fogo/Trevas", folklore: "Alma Penada", sprite: "🐓👻", baseHp: 69, baseAtk: 24, baseDef: 16, evoType: "trade", tradeWith: "FM012A", evoTo: ["FM011B"], evoCount: 2 },
        { id: "FM011B", name: "Galo de Fogo Eterno", element: "Fogo/Trevas", folklore: "Alma Penada", sprite: "🐓🔥👻", baseHp: 97, baseAtk: 33, baseDef: 22, evoType: "none", evoCount: 2 },
        
        { id: "FM012", name: "Cão-Cinza", element: "Trevas", folklore: "Cão Negro", sprite: "🐕", baseHp: 46, baseAtk: 14, baseDef: 12, evoType: "trade", tradeWith: "FM011", evoTo: ["FM012A"], evoCount: 2 },
        { id: "FM012A", name: "Cão das Encruzilhadas", element: "Trevas", folklore: "Cão Negro", sprite: "🐕👻", baseHp: 73, baseAtk: 21, baseDef: 18, evoType: "trade", tradeWith: "FM011A", evoTo: ["FM012B"], evoCount: 2 },
        { id: "FM012B", name: "Cão de Trindade", element: "Trevas", folklore: "Cão Negro", sprite: "🐕💀", baseHp: 101, baseAtk: 29, baseDef: 25, evoType: "none", evoCount: 2 },
        
        { id: "FM013", name: "Tatu-Assombrado", element: "Grama", folklore: "Tatu Peão", sprite: "🦡", baseHp: 52, baseAtk: 11, baseDef: 16, evoType: "trade", tradeWith: "FM014", evoTo: ["FM013A"], evoCount: 2 },
        { id: "FM013A", name: "Tatu das Trevas", element: "Grama/Trevas", folklore: "Tatu Peão", sprite: "🦡👻", baseHp: 79, baseAtk: 17, baseDef: 23, evoType: "trade", tradeWith: "FM014A", evoTo: ["FM013B"], evoCount: 2 },
        { id: "FM013B", name: "Tatu-Cascudo Eterno", element: "Grama/Trevas", folklore: "Tatu Peão", sprite: "🦡💀", baseHp: 107, baseAtk: 24, baseDef: 32, evoType: "none", evoCount: 2 },
        
        { id: "FM014", name: "João-de-Barro", element: "Terra", folklore: "João-de-Barro Encantado", sprite: "🐦", baseHp: 45, baseAtk: 13, baseDef: 14, evoType: "trade", tradeWith: "FM013", evoTo: ["FM014A"], evoCount: 2 },
        { id: "FM014A", name: "João-Construtor", element: "Terra", folklore: "João-de-Barro", sprite: "🐦🏠", baseHp: 72, baseAtk: 19, baseDef: 21, evoType: "trade", tradeWith: "FM013A", evoTo: ["FM014B"], evoCount: 2 },
        { id: "FM014B", name: "Mestre-Argamassa", element: "Terra/Grama", folklore: "João-de-Barro", sprite: "🐦⛏️", baseHp: 100, baseAtk: 27, baseDef: 29, evoType: "none", evoCount: 2 },
        
        { id: "FM015", name: "Sapo-Prateado", element: "Agua", folklore: "Sapo Cururu", sprite: "🐸", baseHp: 48, baseAtk: 12, baseDef: 13, evoType: "trade", tradeWith: "FM016", evoTo: ["FM015A"], evoCount: 2 },
        { id: "FM015A", name: "Sapo Mágico", element: "Agua/Eletrico", folklore: "Sapo Cururu", sprite: "🐸⚡", baseHp: 75, baseAtk: 18, baseDef: 19, evoType: "trade", tradeWith: "FM016A", evoTo: ["FM015B"], evoCount: 2 },
        { id: "FM015B", name: "Sapão Encantado", element: "Agua/Eletrico", folklore: "Sapo Cururu", sprite: "🐸✨", baseHp: 103, baseAtk: 26, baseDef: 27, evoType: "none", evoCount: 2 },
        
        { id: "FM016", name: "Rã-Vermelha", element: "Fogo", folklore: "Rã Encantada", sprite: "🐸", baseHp: 43, baseAtk: 16, baseDef: 10, evoType: "trade", tradeWith: "FM015", evoTo: ["FM016A"], evoCount: 2 },
        { id: "FM016A", name: "Rã Incendiária", element: "Fogo", folklore: "Rã Encantada", sprite: "🐸🔥", baseHp: 70, baseAtk: 25, baseDef: 15, evoType: "trade", tradeWith: "FM015A", evoTo: ["FM016B"], evoCount: 2 },
        { id: "FM016B", name: "Rã Vulcânica", element: "Fogo/Agua", folklore: "Rã Encantada", sprite: "🐸🌋", baseHp: 98, baseAtk: 34, baseDef: 21, evoType: "none", evoCount: 2 },
        
        { id: "FM017", name: "Boto-Cinza", element: "Agua", folklore: "Boto", sprite: "🐬", baseHp: 50, baseAtk: 14, baseDef: 14, evoType: "trade", tradeWith: "FM018", evoTo: ["FM017A"], evoCount: 2 },
        { id: "FM017A", name: "Boto Sedutor", element: "Agua/Trevas", folklore: "Boto", sprite: "🐬👔", baseHp: 77, baseAtk: 21, baseDef: 20, evoType: "trade", tradeWith: "FM018A", evoTo: ["FM017B"], evoCount: 2 },
        { id: "FM017B", name: "Boto Encantador", element: "Agua/Trevas", folklore: "Boto", sprite: "🐬🎩", baseHp: 105, baseAtk: 29, baseDef: 28, evoType: "none", evoCount: 2 },
        
        { id: "FM018", name: "Peixe-Boi", element: "Agua", folklore: "Peixe-Boi Místico", sprite: "🐋", baseHp: 55, baseAtk: 12, baseDef: 17, evoType: "trade", tradeWith: "FM017", evoTo: ["FM018A"], evoCount: 2 },
        { id: "FM018A", name: "Peixe-Boi Guardião", element: "Agua", folklore: "Peixe-Boi Místico", sprite: "🐋💧", baseHp: 82, baseAtk: 18, baseDef: 24, evoType: "trade", tradeWith: "FM017A", evoTo: ["FM018B"], evoCount: 2 },
        { id: "FM018B", name: "Boto-Rei Aquático", element: "Agua", folklore: "Peixe-Boi Místico", sprite: "🐋👑", baseHp: 110, baseAtk: 26, baseDef: 33, evoType: "none", evoCount: 2 },
        
        { id: "FM019", name: "Macaco-Prego", element: "Grama", folklore: "Macaco Encantado", sprite: "🐵", baseHp: 47, baseAtk: 16, baseDef: 11, evoType: "trade", tradeWith: "FM020", evoTo: ["FM019A"], evoCount: 2 },
        { id: "FM019A", name: "Macaco-Travesso", element: "Grama/Fogo", folklore: "Macaco Encantado", sprite: "🐵💨", baseHp: 74, baseAtk: 25, baseDef: 16, evoType: "trade", tradeWith: "FM020A", evoTo: ["FM019B"], evoCount: 2 },
        { id: "FM019B", name: "Saci-Macaco", element: "Grama/Fogo", folklore: "Macaco Encantado", sprite: "🐵🔥", baseHp: 102, baseAtk: 34, baseDef: 22, evoType: "none", evoCount: 2 },
        
        { id: "FM020", name: "Sagui-Fantasma", element: "Trevas", folklore: "Alma de Bicho", sprite: "🐒", baseHp: 41, baseAtk: 17, baseDef: 9, evoType: "trade", tradeWith: "FM019", evoTo: ["FM020A"], evoCount: 2 },
        { id: "FM020A", name: "Sagui Malandro", element: "Trevas/Fogo", folklore: "Alma de Bicho", sprite: "🐒👻", baseHp: 68, baseAtk: 26, baseDef: 14, evoType: "trade", tradeWith: "FM019A", evoTo: ["FM020B"], evoCount: 2 },
        { id: "FM020B", name: "Malandro das Matas", element: "Trevas/Fogo", folklore: "Alma de Bicho", sprite: "🐒💨", baseHp: 96, baseAtk: 35, baseDef: 20, evoType: "none", evoCount: 2 },
        
        // 21-50 EVOLUEM POR LEVEL (30 monstros)
        { id: "FM021", name: "Grilo-Cantor", element: "Grama", folklore: "Grilo Encantado", sprite: "🦗", baseHp: 40, baseAtk: 14, baseDef: 10, evoType: "level", evoLevel: 16, evoTo: ["FM021A"], evoCount: 2 },
        { id: "FM021A", name: "Grilo Mágico", element: "Grama/Eletrico", folklore: "Grilo Encantado", sprite: "🦗✨", baseHp: 66, baseAtk: 22, baseDef: 16, evoType: "level", evoLevel: 32, evoTo: ["FM021B"], evoCount: 2 },
        { id: "FM021B", name: "Cigarra Encantada", element: "Grama/Eletrico", folklore: "Cigarra Mística", sprite: "🦗⚡", baseHp: 94, baseAtk: 30, baseDef: 23, evoType: "none", evoCount: 2 },
        
        { id: "FM022", name: "Formiga-Gigante", element: "Terra", folklore: "Formiga Mística", sprite: "🐜", baseHp: 53, baseAtk: 15, baseDef: 15, evoType: "level", evoLevel: 17, evoTo: ["FM022A"], evoCount: 2 },
        { id: "FM022A", name: "Formigueiro Vivo", element: "Terra", folklore: "Formiga Mística", sprite: "🐜🏰", baseHp: 80, baseAtk: 23, baseDef: 22, evoType: "level", evoLevel: 33, evoTo: ["FM022B"], evoCount: 2 },
        { id: "FM022B", name: "Rainha-Formiga", element: "Terra/Grama", folklore: "Formiga Mística", sprite: "🐜👑", baseHp: 108, baseAtk: 31, baseDef: 30, evoType: "none", evoCount: 2 },
        
        { id: "FM023", name: "Besouro-Dourado", element: "Terra", folklore: "Besouro Místico", sprite: "🪲", baseHp: 48, baseAtk: 16, baseDef: 13, evoType: "level", evoLevel: 18, evoTo: ["FM023A"], evoCount: 2 },
        { id: "FM023A", name: "Besouro-Cristal", element: "Terra/Eletrico", folklore: "Besouro Místico", sprite: "🪲💎", baseHp: 75, baseAtk: 25, baseDef: 19, evoType: "level", evoLevel: 34, evoTo: ["FM023B"], evoCount: 2 },
        { id: "FM023B", name: "Escaravelho Sagrado", element: "Terra/Eletrico", folklore: "Besouro Místico", sprite: "🪲✨", baseHp: 103, baseAtk: 34, baseDef: 26, evoType: "none", evoCount: 2 },
        
        { id: "FM024", name: "Mariposa-Cinza", element: "Trevas", folklore: "Alma de Mariposa", sprite: "🦋", baseHp: 39, baseAtk: 15, baseDef: 11, evoType: "level", evoLevel: 16, evoTo: ["FM024A"], evoCount: 2 },
        { id: "FM024A", name: "Mariposa-Fantasma", element: "Trevas", folklore: "Alma de Mariposa", sprite: "🦋👻", baseHp: 65, baseAtk: 24, baseDef: 17, evoType: "level", evoLevel: 32, evoTo: ["FM024B"], evoCount: 2 },
        { id: "FM024B", name: "Borboleta das Almas", element: "Trevas/Vento", folklore: "Alma de Mariposa", sprite: "🦋💀", baseHp: 93, baseAtk: 33, baseDef: 24, evoType: "none", evoCount: 2 },
        
        { id: "FM025", name: "Coruja-Pequena", element: "Vento", folklore: "Coruja Mística", sprite: "🦉", baseHp: 44, baseAtk: 17, baseDef: 12, evoType: "level", evoLevel: 17, evoTo: ["FM025A"], evoCount: 2 },
        { id: "FM025A", name: "Coruja Noturna", element: "Vento/Trevas", folklore: "Coruja Mística", sprite: "🦉👻", baseHp: 71, baseAtk: 26, baseDef: 18, evoType: "level", evoLevel: 33, evoTo: ["FM025B"], evoCount: 2 },
        { id: "FM025B", name: "Coruja dos Presságios", element: "Vento/Trevas", folklore: "Coruja Mística", sprite: "🦉✨", baseHp: 99, baseAtk: 35, baseDef: 25, evoType: "none", evoCount: 2 },
        
        { id: "FM026", name: "Tatu-Bola", element: "Terra", folklore: "Tatu Místico", sprite: "🦡", baseHp: 51, baseAtk: 12, baseDef: 16, evoType: "level", evoLevel: 18, evoTo: ["FM026A"], evoCount: 2 },
        { id: "FM026A", name: "Tatu-Rolha", element: "Terra", folklore: "Tatu Místico", sprite: "🦡⛺", baseHp: 78, baseAtk: 19, baseDef: 23, evoType: "level", evoLevel: 34, evoTo: ["FM026B"], evoCount: 2 },
        { id: "FM026B", name: "Tatu-Montanha", element: "Terra/Grama", folklore: "Tatu Místico", sprite: "🦡🏔️", baseHp: 106, baseAtk: 27, baseDef: 32, evoType: "none", evoCount: 2 },
        
        { id: "FM027", name: "Lagarto-Verde", element: "Grama", folklore: "Lagarto Encantado", sprite: "🦎", baseHp: 46, baseAtk: 15, baseDef: 13, evoType: "level", evoLevel: 19, evoTo: ["FM027A"], evoCount: 2 },
        { id: "FM027A", name: "Lagarto-Camaleão", element: "Grama/Trevas", folklore: "Lagarto Encantado", sprite: "🦎🎭", baseHp: 73, baseAtk: 24, baseDef: 19, evoType: "level", evoLevel: 35, evoTo: ["FM027B"], evoCount: 2 },
        { id: "FM027B", name: "Camaleão Místico", element: "Grama/Trevas", folklore: "Lagarto Encantado", sprite: "🦎✨", baseHp: 101, baseAtk: 33, baseDef: 26, evoType: "none", evoCount: 2 },
        
        { id: "FM028", name: "Piranha-Curiosa", element: "Agua", folklore: "Piranha Mística", sprite: "🐟", baseHp: 43, baseAtk: 18, baseDef: 11, evoType: "level", evoLevel: 20, evoTo: ["FM028A"], evoCount: 2 },
        { id: "FM028A", name: "Cardume-Mágico", element: "Agua/Eletrico", folklore: "Piranha Mística", sprite: "🐟⚡", baseHp: 70, baseAtk: 27, baseDef: 17, evoType: "level", evoLevel: 36, evoTo: ["FM028B"], evoCount: 2 },
        { id: "FM028B", name: "Piranha-Rei", element: "Agua/Eletrico", folklore: "Piranha Mística", sprite: "🐟👑", baseHp: 98, baseAtk: 36, baseDef: 24, evoType: "none", evoCount: 2 },
        
        { id: "FM029", name: "Aranha-Teceria", element: "Grama", folklore: "Aranha Mística", sprite: "🕷️", baseHp: 45, baseAtk: 16, baseDef: 12, evoType: "level", evoLevel: 19, evoTo: ["FM029A"], evoCount: 2 },
        { id: "FM029A", name: "Aranha-Teia Mágica", element: "Grama/Trevas", folklore: "Aranha Mística", sprite: "🕷️✨", baseHp: 72, baseAtk: 25, baseDef: 18, evoType: "level", evoLevel: 35, evoTo: ["FM029B"], evoCount: 2 },
        { id: "FM029B", name: "Nephila Encantada", element: "Grama/Trevas", folklore: "Aranha Mística", sprite: "🕷️💎", baseHp: 100, baseAtk: 34, baseDef: 25, evoType: "none", evoCount: 2 },
        
        { id: "FM030", name: "Vespa-Amarela", element: "Eletrico", folklore: "Vespa Mística", sprite: "🐝", baseHp: 44, baseAtk: 19, baseDef: 11, evoType: "level", evoLevel: 20, evoTo: ["FM030A"], evoCount: 2 },
        { id: "FM030A", name: "Enxame-Fantasma", element: "Eletrico/Trevas", folklore: "Vespa Mística", sprite: "🐝👻", baseHp: 71, baseAtk: 28, baseDef: 17, evoType: "level", evoLevel: 36, evoTo: ["FM030B"], evoCount: 2 },
        { id: "FM030B", name: "Vespa-Rei", element: "Eletrico/Trevas", folklore: "Vespa Mística", sprite: "🐝👑", baseHp: 99, baseAtk: 37, baseDef: 24, evoType: "none", evoCount: 2 },
        
        { id: "FM031", name: "Caranguejo-Místico", element: "Agua", folklore: "Caranguejo Místico", sprite: "🦀", baseHp: 47, baseAtk: 15, baseDef: 15, evoType: "level", evoLevel: 21, evoTo: ["FM031A"], evoCount: 2 },
        { id: "FM031A", name: "Caranguejo-Cascudo", element: "Agua/Terra", folklore: "Caranguejo Místico", sprite: "🦀🛡️", baseHp: 74, baseAtk: 23, baseDef: 22, evoType: "level", evoLevel: 37, evoTo: ["FM031B"], evoCount: 2 },
        { id: "FM031B", name: "Sirigaita Mística", element: "Agua/Terra", folklore: "Caranguejo Místico", sprite: "🦀👑", baseHp: 102, baseAtk: 31, baseDef: 30, evoType: "none", evoCount: 2 },
        
        { id: "FM032", name: "Camaleão-Roxo", element: "Grama", folklore: "Lagartixa Mística", sprite: "🦎", baseHp: 46, baseAtk: 17, baseDef: 12, evoType: "level", evoLevel: 22, evoTo: ["FM032A"], evoCount: 2 },
        { id: "FM032A", name: "Lagartixa-Ilusionista", element: "Grama/Trevas", folklore: "Lagartixa Mística", sprite: "🦎🎭", baseHp: 73, baseAtk: 26, baseDef: 18, evoType: "level", evoLevel: 38, evoTo: ["FM032B"], evoCount: 2 },
        { id: "FM032B", name: "Camaleão das Ilusões", element: "Grama/Trevas", folklore: "Lagartixa Mística", sprite: "🦎✨", baseHp: 101, baseAtk: 35, baseDef: 25, evoType: "none", evoCount: 2 },
        
        { id: "FM033", name: "Tamanduá-Místico", element: "Terra", folklore: "Tamanduá Místico", sprite: "🦡", baseHp: 50, baseAtk: 17, baseDef: 14, evoType: "level", evoLevel: 23, evoTo: ["FM033A"], evoCount: 2 },
        { id: "FM033A", name: "Tamanduá-Fantasma", element: "Terra/Trevas", folklore: "Tamanduá Místico", sprite: "🦡👻", baseHp: 77, baseAtk: 26, baseDef: 20, evoType: "level", evoLevel: 39, evoTo: ["FM033B"], evoCount: 2 },
        { id: "FM033B", name: "Tamanduá-Bandeira Eterno", element: "Terra/Trevas", folklore: "Tamanduá Místico", sprite: "🦡💀", baseHp: 105, baseAtk: 35, baseDef: 28, evoType: "none", evoCount: 2 },
        
        { id: "FM034", name: "Capivara-Mística", element: "Agua", folklore: "Capivara Encantada", sprite: "🐹", baseHp: 57, baseAtk: 13, baseDef: 16, evoType: "level", evoLevel: 24, evoTo: ["FM034A"], evoCount: 2 },
        { id: "FM034A", name: "Capivara-Protetora", element: "Agua/Grama", folklore: "Capivara Encantada", sprite: "🐹🛡️", baseHp: 84, baseAtk: 20, baseDef: 23, evoType: "level", evoLevel: 40, evoTo: ["FM034B"], evoCount: 2 },
        { id: "FM034B", name: "Capivara-Rei dos Rios", element: "Agua/Grama", folklore: "Capivara Encantada", sprite: "🐹👑", baseHp: 112, baseAtk: 28, baseDef: 31, evoType: "none", evoCount: 2 },
        
        { id: "FM035", name: "Onça-Pintada", element: "Grama", folklore: "Onça Encantada", sprite: "🐆", baseHp: 54, baseAtk: 19, baseDef: 13, evoType: "level", evoLevel: 25, evoTo: ["FM035A"], evoCount: 2 },
        { id: "FM035A", name: "Onça-Fantasma", element: "Grama/Trevas", folklore: "Onça Encantada", sprite: "🐆👻", baseHp: 81, baseAtk: 28, baseDef: 19, evoType: "level", evoLevel: 41, evoTo: ["FM035B"], evoCount: 2 },
        { id: "FM035B", name: "Jaguatirica Mística", element: "Grama/Trevas", folklore: "Onça Encantada", sprite: "🐆✨", baseHp: 109, baseAtk: 37, baseDef: 27, evoType: "none", evoCount: 2 },
        
        { id: "FM036", name: "Jacaré-Místico", element: "Agua", folklore: "Jacaré Encantado", sprite: "🐊", baseHp: 56, baseAtk: 18, baseDef: 15, evoType: "level", evoLevel: 26, evoTo: ["FM036A"], evoCount: 2 },
        { id: "FM036A", name: "Jacaré-Cascudo", element: "Agua/Terra", folklore: "Jacaré Encantado", sprite: "🐊🛡️", baseHp: 83, baseAtk: 27, baseDef: 22, evoType: "level", evoLevel: 42, evoTo: ["FM036B"], evoCount: 2 },
        { id: "FM036B", name: "Jacaré-Rei dos Pantanais", element: "Agua/Terra", folklore: "Jacaré Encantado", sprite: "🐊👑", baseHp: 111, baseAtk: 36, baseDef: 30, evoType: "none", evoCount: 2 },
        
        { id: "FM037", name: "Gambá-Místico", element: "Trevas", folklore: "Gambá Encantado", sprite: "🦡", baseHp: 49, baseAtk: 17, baseDef: 14, evoType: "level", evoLevel: 27, evoTo: ["FM037A"], evoCount: 2 },
        { id: "FM037A", name: "Gambá-Fedorento", element: "Trevas", folklore: "Gambá Encantado", sprite: "🦡💨", baseHp: 76, baseAtk: 26, baseDef: 20, evoType: "level", evoLevel: 43, evoTo: ["FM037B"], evoCount: 2 },
        { id: "FM037B", name: "Gambá das Sombras", element: "Trevas/Fogo", folklore: "Gambá Encantado", sprite: "🦡🔥", baseHp: 104, baseAtk: 35, baseDef: 28, evoType: "none", evoCount: 2 },
        
        { id: "FM038", name: "Quati-Místico", element: "Grama", folklore: "Quati Encantado", sprite: "🦝", baseHp: 51, baseAtk: 18, baseDef: 13, evoType: "level", evoLevel: 28, evoTo: ["FM038A"], evoCount: 2 },
        { id: "FM038A", name: "Quati-Travesso", element: "Grama/Fogo", folklore: "Quati Encantado", sprite: "🦝💨", baseHp: 78, baseAtk: 27, baseDef: 19, evoType: "level", evoLevel: 44, evoTo: ["FM038B"], evoCount: 2 },
        { id: "FM038B", name: "Quati-Malandro", element: "Grama/Fogo", folklore: "Quati Encantado", sprite: "🦝🔥", baseHp: 106, baseAtk: 36, baseDef: 27, evoType: "none", evoCount: 2 },
        
        { id: "FM039", name: "Morcego-Místico", element: "Vento", folklore: "Morcego Encantado", sprite: "🦇", baseHp: 47, baseAtk: 19, baseDef: 12, evoType: "level", evoLevel: 29, evoTo: ["FM039A"], evoCount: 2 },
        { id: "FM039A", name: "Morcego-Vampiro", element: "Vento/Trevas", folklore: "Morcego Encantado", sprite: "🦇🩸", baseHp: 74, baseAtk: 28, baseDef: 18, evoType: "level", evoLevel: 45, evoTo: ["FM039B"], evoCount: 2 },
        { id: "FM039B", name: "Morcego das Trevas", element: "Vento/Trevas", folklore: "Morcego Encantado", sprite: "🦇💀", baseHp: 102, baseAtk: 37, baseDef: 26, evoType: "none", evoCount: 2 },
        
        { id: "FM040", name: "Jabuti-Místico", element: "Terra", folklore: "Jabuti Encantado", sprite: "🐢", baseHp: 59, baseAtk: 14, baseDef: 18, evoType: "level", evoLevel: 30, evoTo: ["FM040A"], evoCount: 2 },
        { id: "FM040A", name: "Jabuti-Sabio", element: "Terra/Grama", folklore: "Jabuti Encantado", sprite: "🐢📚", baseHp: 86, baseAtk: 21, baseDef: 25, evoType: "level", evoLevel: 46, evoTo: ["FM040B"], evoCount: 2 },
        { id: "FM040B", name: "Jabuti-Ancião", element: "Terra/Grama", folklore: "Jabuti Encantado", sprite: "🐢👑", baseHp: 114, baseAtk: 29, baseDef: 34, evoType: "none", evoCount: 2 },
        
        { id: "FM041", name: "Cobra-Coral", element: "Fogo", folklore: "Cobra Coral Mística", sprite: "🐍", baseHp: 48, baseAtk: 20, baseDef: 13, evoType: "level", evoLevel: 31, evoTo: ["FM041A"], evoCount: 2 },
        { id: "FM041A", name: "Cobra-Coral-Venenosa", element: "Fogo/Trevas", folklore: "Cobra Coral Mística", sprite: "🐍☠️", baseHp: 75, baseAtk: 29, baseDef: 19, evoType: "level", evoLevel: 47, evoTo: ["FM041B"], evoCount: 2 },
        { id: "FM041B", name: "Cobra-Coral-Rei", element: "Fogo/Trevas", folklore: "Cobra Coral Mística", sprite: "🐍👑", baseHp: 103, baseAtk: 38, baseDef: 27, evoType: "none", evoCount: 2 },
        
        { id: "FM042", name: "Tucano-Místico", element: "Vento", folklore: "Tucano Encantado", sprite: "🦜", baseHp: 50, baseAtk: 19, baseDef: 14, evoType: "level", evoLevel: 32, evoTo: ["FM042A"], evoCount: 2 },
        { id: "FM042A", name: "Tucano-Arco-Íris", element: "Vento/Eletrico", folklore: "Tucano Encantado", sprite: "🦜🌈", baseHp: 77, baseAtk: 28, baseDef: 20, evoType: "level", evoLevel: 48, evoTo: ["FM042B"], evoCount: 2 },
        { id: "FM042B", name: "Tucano das Cores", element: "Vento/Eletrico", folklore: "Tucano Encantado", sprite: "🦜✨", baseHp: 105, baseAtk: 37, baseDef: 28, evoType: "none", evoCount: 2 },
        
        { id: "FM043", name: "Preguiça-Mística", element: "Grama", folklore: "Preguiça Encantada", sprite: "🦥", baseHp: 58, baseAtk: 15, baseDef: 17, evoType: "level", evoLevel: 33, evoTo: ["FM043A"], evoCount: 2 },
        { id: "FM043A", name: "Preguiça-Sonhadora", element: "Grama/Vento", folklore: "Preguiça Encantada", sprite: "🦥😴", baseHp: 85, baseAtk: 22, baseDef: 24, evoType: "level", evoLevel: 49, evoTo: ["FM043B"], evoCount: 2 },
        { id: "FM043B", name: "Preguiça dos Sonhos", element: "Grama/Vento", folklore: "Preguiça Encantada", sprite: "🦥💭", baseHp: 113, baseAtk: 30, baseDef: 32, evoType: "none", evoCount: 2 },
        
        { id: "FM044", name: "Porco-Do-Mato", element: "Terra", folklore: "Porco-Mato Místico", sprite: "🐗", baseHp: 55, baseAtk: 19, baseDef: 16, evoType: "level", evoLevel: 34, evoTo: ["FM044A"], evoCount: 2 },
        { id: "FM044A", name: "Javali-Fantasma", element: "Terra/Trevas", folklore: "Porco-Mato Místico", sprite: "🐗👻", baseHp: 82, baseAtk: 28, baseDef: 23, evoType: "level", evoLevel: 50, evoTo: ["FM044B"], evoCount: 2 },
        { id: "FM044B", name: "Javali das Trevas", element: "Terra/Trevas", folklore: "Porco-Mato Místico", sprite: "🐗💀", baseHp: 110, baseAtk: 37, baseDef: 31, evoType: "none", evoCount: 2 },
        
        { id: "FM045", name: "Perereca-Mística", element: "Agua", folklore: "Perereca Encantada", sprite: "🐸", baseHp: 46, baseAtk: 18, baseDef: 14, evoType: "level", evoLevel: 35, evoTo: ["FM045A"], evoCount: 2 },
        { id: "FM045A", name: "Perereca-Arco-Íris", element: "Agua/Eletrico", folklore: "Perereca Encantada", sprite: "🐸🌈", baseHp: 73, baseAtk: 27, baseDef: 20, evoType: "level", evoLevel: 51, evoTo: ["FM045B"], evoCount: 2 },
        { id: "FM045B", name: "Perereca das Chuvas", element: "Agua/Eletrico", folklore: "Perereca Encantada", sprite: "🐸⚡", baseHp: 101, baseAtk: 36, baseDef: 28, evoType: "none", evoCount: 2 },
        
        { id: "FM046", name: "Sabiá-Místico", element: "Vento", folklore: "Sabiá Encantado", sprite: "🐦", baseHp: 49, baseAtk: 20, baseDef: 13, evoType: "level", evoLevel: 36, evoTo: ["FM046A"], evoCount: 2 },
        { id: "FM046A", name: "Sabiá-Cantor Mágico", element: "Vento/Eletrico", folklore: "Sabiá Encantado", sprite: "🐦✨", baseHp: 76, baseAtk: 29, baseDef: 19, evoType: "level", evoLevel: 52, evoTo: ["FM046B"], evoCount: 2 },
        { id: "FM046B", name: "Sabiá-Laranjeira Místico", element: "Vento/Eletrico", folklore: "Sabiá Encantado", sprite: "🐦🎵", baseHp: 104, baseAtk: 38, baseDef: 27, evoType: "none", evoCount: 2 },
        
        { id: "FM047", name: "Arara-Mística", element: "Vento", folklore: "Arara Encantada", sprite: "🦜", baseHp: 52, baseAtk: 19, baseDef: 15, evoType: "level", evoLevel: 37, evoTo: ["FM047A"], evoCount: 2 },
        { id: "FM047A", name: "Arara-Jacinto", element: "Vento/Fogo", folklore: "Arara Encantada", sprite: "🦜🔥", baseHp: 79, baseAtk: 28, baseDef: 21, evoType: "level", evoLevel: 53, evoTo: ["FM047B"], evoCount: 2 },
        { id: "FM047B", name: "Arara-Azul Mística", element: "Vento/Fogo", folklore: "Arara Encantada", sprite: "🦜💎", baseHp: 107, baseAtk: 37, baseDef: 29, evoType: "none", evoCount: 2 },
        
        { id: "FM048", name: "Beija-Flor Místico", element: "Vento", folklore: "Beija-Flor Encantado", sprite: "🦋", baseHp: 44, baseAtk: 21, baseDef: 12, evoType: "level", evoLevel: 38, evoTo: ["FM048A"], evoCount: 2 },
        { id: "FM048A", name: "Beija-Flor de Cristal", element: "Vento/Eletrico", folklore: "Beija-Flor Encantado", sprite: "🦋💎", baseHp: 71, baseAtk: 30, baseDef: 18, evoType: "level", evoLevel: 54, evoTo: ["FM048B"], evoCount: 2 },
        { id: "FM048B", name: "Colibri Místico", element: "Vento/Eletrico", folklore: "Beija-Flor Encantado", sprite: "🦋✨", baseHp: 99, baseAtk: 39, baseDef: 26, evoType: "none", evoCount: 2 },
        
        { id: "FM049", name: "Suindara-Mística", element: "Vento", folklore: "Suindara Encantada", sprite: "🦅", baseHp: 53, baseAtk: 20, baseDef: 16, evoType: "level", evoLevel: 39, evoTo: ["FM049A"], evoCount: 2 },
        { id: "FM049A", name: "Suindara-Fantasma", element: "Vento/Trevas", folklore: "Suindara Encantada", sprite: "🦅👻", baseHp: 80, baseAtk: 29, baseDef: 22, evoType: "level", evoLevel: 55, evoTo: ["FM049B"], evoCount: 2 },
        { id: "FM049B", name: "Gavião-Real Místico", element: "Vento/Trevas", folklore: "Suindara Encantada", sprite: "🦅💀", baseHp: 108, baseAtk: 38, baseDef: 30, evoType: "none", evoCount: 2 },
        
        { id: "FM050", name: "Urubu-Místico", element: "Trevas", folklore: "Urubu Encantado", sprite: "🦅", baseHp: 54, baseAtk: 21, baseDef: 15, evoType: "level", evoLevel: 40, evoTo: ["FM050A"], evoCount: 2 },
        { id: "FM050A", name: "Urubu-Rei", element: "Trevas/Vento", folklore: "Urubu Encantado", sprite: "🦅👑", baseHp: 81, baseAtk: 30, baseDef: 21, evoType: "level", evoLevel: 56, evoTo: ["FM050B"], evoCount: 2 },
        { id: "FM050B", name: "Corvo das Almas", element: "Trevas/Vento", folklore: "Urubu Encantado", sprite: "🦅💀", baseHp: 109, baseAtk: 39, baseDef: 29, evoType: "none", evoCount: 2 }
    ]
};

// Itens para evolução por item
const EVO_ITEMS = {
    amuleto_mistico: { id: "amuleto_mistico", name: "Amuleto Místico", sprite: "🔮", desc: "Evolui Mandingueiro", rarity: "raro" },
    grimorio_antigo: { id: "grimorio_antigo", name: "Grimório Antigo", sprite: "📚", desc: "Evolui Bruxo Sertanejo", rarity: "raro" },
    escama_luminosa: { id: "escama_luminosa", name: "Escama Luminosa", sprite: "✨", desc: "Evolui Cobra-Encantada", rarity: "raro" },
    cristal_vapor: { id: "cristal_vapor", name: "Cristal de Vapor", sprite: "💎", desc: "Evolui Serpente Fogo-d'Água", rarity: "raro" },
    lua_prata: { id: "lua_prata", name: "Lua de Prata", sprite: "🌙", desc: "Evolui Lobo-Cão", rarity: "raro" },
    dente_lunatico: { id: "dente_lunatico", name: "Dente Lunático", sprite: "🦷", desc: "Evolui Lobisomem", rarity: "raro" },
    semente_sagrada: { id: "semente_sagrada", name: "Semente Sagrada", sprite: "🌱", desc: "Evolui Caboclinho", rarity: "raro" },
    raiz_protetora: { id: "raiz_protetora", name: "Raiz Protetora", sprite: "🌿", desc: "Evolui Curupira", rarity: "raro" },
    ferradura_fantasma: { id: "ferradura_fantasma", name: "Ferradura Fantasma", sprite: "🧲", desc: "Evolui Ossinho", rarity: "raro" },
    chama_eterea: { id: "chama_eterea", name: "Chama Etérea", sprite: "🔥", desc: "Evolui Mula Flamejante", rarity: "raro" },
    concha_perolada: { id: "concha_perolada", name: "Concha Perolada", sprite: "🐚", desc: "Evolui Peixe-Lenda", rarity: "raro" },
    lagrima_venus: { id: "lagrima_venus", name: "Lágrima de Vênus", sprite: "💧", desc: "Evolui Sereia-d'Água", rarity: "raro" },
    penca_fumo: { id: "penca_fumo", name: "Penca de Fumo", sprite: "🍂", desc: "Evolui Carapinha", rarity: "raro" },
    carapuca_magica: { id: "carapuca_magica", name: "Carapuça Mágica", sprite: "🎩", desc: "Evolui Saci-Pererê", rarity: "raro" },
    folha_milenar: { id: "folha_milenar", name: "Folha Milenar", sprite: "🍃", desc: "Evolui Jibóia-Verde", rarity: "raro" },
    nectar_animal: { id: "nectar_animal", name: "Néctar Animal", sprite: "🍯", desc: "Evolui Cobra-Flor", rarity: "raro" },
    poeira_estelar: { id: "poeira_estelar", name: "Poeira Estelar", sprite: "✨", desc: "Evolui Vagalume-Assombrado", rarity: "raro" },
    alma_vaga: { id: "alma_vaga", name: "Alma Vaga", sprite: "👻", desc: "Evolui Pisadeira", rarity: "raro" },
    pena_celestial: { id: "pena_celestial", name: "Pena Celestial", sprite: "🪶", desc: "Evolui Pássaro-Guia", rarity: "raro" },
    vento_errante: { id: "vento_errante", name: "Vento Errante", sprite: "💨", desc: "Evolui Anhangá", rarity: "raro" }
};

// Itens gerais
const ITEMS = {
    cura_simples: { id: "cura_simples", name: "Erva Curativa", sprite: "🌿", desc: "Restaura 30 PV", effect: "heal", value: 30 },
    cura_media: { id: "cura_media", name: "Cataplasma", sprite: "🩹", desc: "Restaura 60 PV", effect: "heal", value: 60 },
    cura_total: { id: "cura_total", name: "Chá Mágico", sprite: "☕", desc: "Restaura todo PV", effect: "heal", value: 999 },
    resina: { id: "resina", name: "Resina", sprite: "💧", desc: "Material para criar itens" }
};
