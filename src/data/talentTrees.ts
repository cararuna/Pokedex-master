export interface ITalent {
  name: string;
  description: string;
}

export interface ITypeTalentTree {
  type: string;
  icon: string;
  talents: ITalent[];
}

export const getTypeIcon = (type: string): string => {
  const map: Record<string, string> = {
    normal: "/normalType.png",
    grass: "/grassType.png",
    fire: "/fireType.png",
    dragon: "/dragonType.png",
    steel: "/steelType.png",
    dark: "/darkType.png",
    ghost: "/ghostType.png",
    flying: "/flyingType.png",
    water: "/waterType.png",
    bug: "/bugType.png",
    psychic: "/psychicType.png",
    poison: "/poisonType.png",
    electric: "/electricType.png",
    ground: "/groundType.png",
    fighting: "/fightingType.png",
    fairy: "/fairyType.png",
    ice: "/iceType.png",
    rock: "/rockType.png",
  };
  return map[type.toLowerCase()] || "/normalType.png";
};

export const typeTalentTrees: Record<string, ITypeTalentTree> = {
  fire: {
    type: "Fire",
    icon: "/fireType.png",
    talents: [
      { name: "Chama Potente", description: "+1 em ataques Fire" },
      { name: "Burn Aprimorado", description: "Rolagem de burn com vantagem" },
      { name: "Aura Vulcanica", description: "Reduz defesa inimiga em 1" },
    ],
  },
  water: {
    type: "Water",
    icon: "/waterType.png",
    talents: [
      { name: "Fluxo", description: "+1 em ataques Water" },
      { name: "Pressão Aquática", description: "Reduz ataque inimigo em -1" },
      { name: "Pulso de Cura", description: "Ao inflingir qualquer status, cure um Pokémon da equipe" },
    ],
  },
  grass: {
    type: "Grass",
    icon: "/grassType.png",
    talents: [
      { name: "Feixe Solar", description: "+1 em ataques do tipo Grass" },
      { name: "Semente de sanguessuga", description: "Sempre que infligir ou receber qualquer status, remova o status de um Pokémon da sua equipe" },
      { name: "Esporos Fortes", description: "Rolagem de Sono com vantagem" },
    ],
  },
  electric: {
    type: "Electric",
    icon: "/electricType.png",
    talents: [
      { name: "Sobrecarga", description: "+1 em ataques Electric" },
      { name: "Estática", description: "Rolagem para paralisia com vantagem" },
      { name: "Circuito", description: "Ao inflingir paralisia a um pokémon em batalha, escolha mais um da equipe inimiga para receber o mesmo status" },
    ],
  },
  ice: {
    type: "Ice",
    icon: "/iceType.png",
    talents: [
      { name: "Frio Intenso", description: "+1 em ataques do Ice" },
      { name: "Congelamento Forte", description: "Rolagem de congelamento com vantagem" },
      { name: "Aura Congelante", description: "Nenhum pokémon em batalha contra esse pokémon recebe qualquer bônus de habilidades inatas ou do tipo" },
    ],
  },
  rock: {
    type: "Rock",
    icon: "/rockType.png",
    talents: [
      { name: "Defesa Natural", description: "+1 defesa" },
      { name: "Peso", description: "Todos seus ataques recebem +1 de dano" },
      { name: "Estabilidade", description: "Não sofre redução de defesa" },
    ],
  },
  ground: {
    type: "Ground",
    icon: "/groundType.png",
    talents: [
      { name: "Areia Fina", description: "+1 em ataques do tipo Terra" },
      { name: "Consistência", description: "+1 de defesa" },
      { name: "Tremor", description: "Reduz a agilidade de todo pokémon que batalhar contra a equipe com esse pokémon em -1, enquanto saudável." },
    ],
  },
  dragon: {
    type: "Dragon",
    icon: "/dragonType.png",
    talents: [
      { name: "Força Dracônica", description: "+1 em todos ataques do pokémon" },
      { name: "Resistência Ancestral", description: "Desvantagem em rolagens para inflingir status contra esse pokémon" },
      { name: "Intimidação", description: "Reduz ataque inimigo em -1 e vence empates" },
    ],
  },
  ghost: {
    type: "Ghost",
    icon: "/ghostType.png",
    talents: [
      { name: "Assombração", description: "Copia qualquer ataque do pokémon inimigo contra ele mesmo, independente do tipo do ataque" },
      { name: "Intimidação", description: "Reduz ataque inimigo em -1 e vence empates" },
      { name: "Maldição", description: "Ao morrer o pokémon inflinge confused em um pokémon da equipe inimiga a escolha do treinador" },
    ],
  },
  poison: {
    type: "Poison",
    icon: "/poisonType.png",
    talents: [
      { name: "Badly Poison", description: "Aplica o status de poison dobrado com 2 tokens de veneno." },
      { name: "Aura Corrosiva", description: "Reduz defesa do pokémon inimigo em -1" },
      { name: "Peçonha Persistente", description: "Ao inflingir poison em algum pokémon já envenenado, escolha outro da equipe inimiga para receber o status (não pode escolher Pokémons imunes a poison)." },
    ],
  },
  psychic: {
    type: "Psychic",
    icon: "/psychicType.png",
    talents: [
      { name: "Leitura Mental", description: "+1 em ataques do tipo Psychic" },
      { name: "Confusão Forte", description: "Teste de confusão com vantagem" },
      { name: "Pressão Mental", description: "Habilidades inatas e de tipo não se aplicam em batalhas contra esse Pokémon" },
    ],
  },
  flying: {
    type: "Flying",
    icon: "/flyingType.png",
    talents: [
      { name: "Ataque Aéreo", description: "+1 em ataques do tipo Voador" },
      { name: "Evasão", description: "+1 de agilidade" },
      { name: "Ventania", description: "Ao entrar em batalha, esse pokémon cancela todos os efeitos de terreno (chuva, dança sol, tempestades e similares)" },
    ],
  },
  fighting: {
    type: "Fighting",
    icon: "/fightingType.png",
    talents: [
      { name: "Força Bruta", description: "+1 em ataques do tipo Lutador" },
      { name: "Golpe Preciso", description: "Ataques do tipo lutador são rolados com vantagem" },
      { name: "Melhor ataque é a defesa!", description: "Defesa +1" },
    ],
  },
  bug: {
    type: "Bug",
    icon: "/bugType.png",
    talents: [
      { name: "Em nome da rainha!", description: "+1 em ataques do tipo Inseto" },
      { name: "Enxame", description: "Ataques do tipo inseto recebem +1 para cada bug vivo na equipe" },
      { name: "Adaptação", description: "Ao inflingir o status de paralisia ou envenenamento, pode escolher dentre os dois status a ser aplicado ao alvo" },
    ],
  },
  normal: {
    type: "Normal",
    icon: "/normalType.png",
    talents: [
      { name: "Equilíbrio", description: "+1 para todos os ataques do Pokémon" },
      { name: "Consistência", description: "Todo teste de inflingir status contra esse Pokémon tem desvantagem" },
      { name: "Flexibilidade", description: "Ao adquirir essa habilidade, escolha um status para seu pokémon se tornar totalmente imune para o resto do jogo" },
    ],
  },
  dark: {
    type: "Dark",
    icon: "/darkType.png",
    talents: [
      { name: "Sombra", description: "+1 em ataques Dark" },
      { name: "Intimidação", description: "Reduz ataque inimigo em -1 e vence empates" },
      { name: "Jogo sujo", description: "Nenhuma vantagem de qualquer tipo se aplica ao time do treinador que tiver esse Pokémon saudável em sua equipe" },
    ],
  },
  steel: {
    type: "Steel",
    icon: "/steelType.png",
    talents: [
      { name: "Aço", description: "+1 de defesa" },
      { name: "Blindagem", description: "Todo teste para inflingir status contra esse Pokémon tem desvantagem" },
      { name: "Rigidez", description: "Não sofre redução de defesa" },
    ],
  },
  fairy: {
    type: "Fairy",
    icon: "/fairyType.png",
    talents: [
      { name: "Encanto", description: "+1 em ataques Fairy" },
      { name: "Equilíbrio Mágico", description: "Sempre que um Pokémon da sua equipe receber um status, você pode escolher outro da equipe para receber o status no lugar do pokémon alvo" },
      { name: "Proteção", description: "Todo teste para inflingir status contra um Pokémon da equipe com esse Pokémon tem desvantagem" },
    ],
  },
};

// ========================================================================
// CATÁLOGO DE HABILIDADES COMPARTILHADAS
// Edite aqui para alterar a habilidade em todos os Pokémon que a utilizam
// ========================================================================
export const ABILITIES: Record<string, ITalent> = {
  // ── Clima ──
  SUNNY_DAY: { name: "Dia Ensolarado", description: "Ao entrar em batalha, sumone um dia ensolarado até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
  RAIN_DANCE: { name: "Dança da Chuva", description: "Sumone uma chuva até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
  SANDSTORM: { name: "Tempestade de Areia", description: "Sumone uma tempeste de areia até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
  HAIL: { name: "Tempestade de Granizo", description: "Sumone uma tempeste de granizo até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
  FOG: { name: "Névoa", description: "Sumone uma névoa até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
  ELECTRIC_STORM: { name: "Tempestade Elétrica", description: "Sumone uma Tempestade Elétrica até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
  CLOUD_NINE: { name: "Núvem Nove", description: "Enquanto este Pokémon estiver saudável em uma equipe, nenhum efeito de clima deverá ser aplicado" },

  // ── Dependente de Clima ──
  CHLOROPHYLL: { name: "Clorofila", description: "+2 de agilidade se dia ensolarado estiver ativo" },
  SOLAR_POWER: { name: "Poder Solar", description: "+1 em todos ataques se dia ensolarado estiver ativo" },
  SWIFT_SWIM: { name: "Nado Rápido", description: "Se dança da chuva estiver ativa, este Pokémon recebe +2 de agilidade" },
  HYDRATION: { name: "Hidratação", description: "Se dança da chuva estiver ativa, este Pokémon fica imune a todos status" },
  DRIZZLE: { name: "Chuva Fina", description: "Se dança da chuva estiver ativa, todo ataque contra este Pokémon será em desvantagem" },
  RAIN_DISH: { name: "Chuvisco", description: "Se estiver chovendo, esse Pokémon recebe +1 de defesa" },
  SAND_VEIL: { name: "Véu de Areia", description: "Se tempestade de areia estiver ativa, +2 de agilidade" },
  SAND_VEIL_DEFENSE: { name: "Véu de Areia", description: "+2 de defesa se a tempestade de areia estiver ativa" },
  SAND_RUSH: { name: "Corrida de Areia", description: "+2 de agilidade se a tempestade de areia estiver ativa" },
  ICE_BODY: { name: "Corpo de Gelo", description: "Se tempestade de granizo estiver ativa, este Pokémon só é vencido se perder duas vezes seguidas" },
  SAND_FORCE: { name: "Força da Areia", description: "Se tempestade de areia estiver ativa, todos ataques de Areia e Pedra desse Pokémon recebem +2" },
  DRY_SKIN: { name: "Pele Seca", description: "Se dança da chuva estiver ativa ou qualquer ataque de água for utilizado por algum Pokémon de sua equipe, esse Pokémon recebe +1 de defesa (Sem limites/o valor da defesa reseta ao acabar a batalha)" },

  // ── Imunidade a Status ──
  INNER_FOCUS: { name: "Foco Interno", description: "Este Pokémon é imune a status de confusão, sono e veneno" },
  VITAL_SPIRIT: { name: "Espírito Vital", description: "Este Pokémon é imune a status de sono" },
  OWN_TEMPO: { name: "Ritmo Próprio", description: "Este Pokémon é imune a qualquer status proveniente de ataques" },
  LIMBER: { name: "Flexível", description: "Este Pokémon é imune a paralisia" },
  SOUNDPROOF: { name: "À prova de som", description: "Este Pokémon é imune aos status de confusão e sono" },
  INSOMNIA: { name: "Insônia", description: "Este Pokémon é imune a status de sono" },

  // ── Proteção contra Status ──
  SYNCHRONIZE: { name: "Sincronizar", description: "Reflete todo e qualquer status inflingido a esse Pokémon, ignorando toda e qualquer imunidade, sem necessidade de teste" },
  INFILTRATOR: { name: "Infiltrador", description: "Qualquer status inflingido a esse Pokémon tem desvantagem" },
  WONDER_SKIN: { name: "Pele Maravilhosa", description: "Todo teste de status contra esse Pokémon tem desvantagem" },
  OBLIVIOUS: { name: "Alheio", description: "Todos status inflingidos a esse Pokémon, por ataque, tem desvantagem" },
  STENCH: { name: "Odor Forte", description: "Todo teste de status contra esse Pokémon tem desvantagem" },

  // ── Boost de Ataque por Tipo ──
  OVERGROW: { name: "Overgrow", description: "+1 em ataques Grass" },
  OVERGROW_SUPREME: { name: "Overgrow Supremo", description: "+1 em ataques Grass" },
  BLAZE: { name: "Blaze", description: "+1 em ataques Fire" },
  TORRENT: { name: "Torrent", description: "+1 em ataques do tipo Água" },
  FLAMES: { name: "Chamas", description: "+1 ataque Fire" },
  ELECTRIC_BURST: { name: "Explosão Elétrica", description: "+1 em ataques do tipo Elétrico" },
  LIQUID_OOZE: { name: "Lodo Líquido", description: "+1 de ataque para os ataques de veneno e água" },
  COMPOUND_EYES: { name: "Olhos Compostos", description: "+1 em todos ataques inseto/voador" },

  // ── Veneno ──
  TOXIC_SPORES: { name: "Esporos Tóxicos", description: "Poison aplica 2 stacks" },
  POISON_POINT: { name: "Ponto Venenoso", description: "Sempre que esse Pokémon entra em batalha ou sofre algum status, faça um teste normal para inflingir Poison no Pokémon inimigo" },
  BAD_STENCH: { name: "Mau Cheiro", description: "Trate todo ataque desse Pokémon como se tivesse o status de Poison" },
  STICKY_HOLD: { name: "Aperto Pegajoso", description: "Quando esse Pokémon inflingir Poison a um inimigo, o mesmo recebe dois Tokens de Poison (efeitos dobrados)" },
  POISON_TOUCH: { name: "Toque Venenoso", description: "Sempre que esse Pokémon entra em batalha ou sofre algum status, faça um teste normal para inflingir Veneno ao Pokémon inimigo" },
  TOXIC_CLOUD: { name: "Nuvem Tóxica", description: "Quando esse Pokémon inflingir Poison a um inimigo, escolha outro Pokémon da equipe para receber um token de Poison também" },
  TOXIC_DOMAIN: { name: "Domínio Tóxico", description: "Quando esse Pokémon inflingir Poison a um inimigo, o mesmo recebe dois Tokens de Poison (efeitos dobrados)" },
  TOXIN: { name: "Toxina", description: "Quando esse Pokémon inflingir Poison a um inimigo, o mesmo recebe dois Tokens de Poison (efeitos dobrados)" },

  // ── Defesa ──
  SHELL: { name: "Casco", description: "+1 defesa" },
  SHELL_ARMOR: { name: "Armadura de Casco", description: "+1 de defesa" },
  DUST_SHIELD: { name: "Escudo de pó", description: "+1 de defesa" },
  STURDY: { name: "Robusto", description: "Para vencer esse Pokémon, o oponente precisa vencer duas vezes seguidas" },
  ROCK_HEAD: { name: "Cabeça de Rocha", description: "Ataques com vantagem contra esse Pokémon recebem +1 ao invés de +2" },
  THICK_FAT: { name: "Gordura Espessa", description: "Ataques de fogo e gelo contra esse Pokémon recebem -3 de dano" },
  CLEAR_BODY: { name: "Corpo Transparente", description: "Este Pokémon é imune a todo e qualquer tipo de redução de dano, defesa e agilidade" },
  WEAK_ARMOR: { name: "Armadura Frágil", description: "Todo ataque que não inflinge status contra esse Pokémon, recebe -2 de valor" },
  BATTLE_ARMOR: { name: "Armadura de Batalha", description: "Rolagens críticas (1, 1) ou (5, 5) são ignoradas por esse Pokémon, e devem ser repetidas" },
  MAGIC_BARRIER: { name: "Defesa Mágica", description: "Este Pokémon só pode ser alvo de ataques que não inflingem status" },
  THORNS: { name: "Espinhos", description: "Todo ataque contra esse Pokémon que tiver vantagem por seu tipo, perde o +2 pontos da vantagem" },
  LEAF_ARMOR: { name: "Armadura de Folhas", description: "Se dia ensolarado estiver ativo, este Pokémon recebe +2 de defesa e fica imune a qualquer status" },

  // ── Intimidação / Debuff ──
  INTIMIDATE: { name: "Intimidar", description: "Reduz ataque inimigo em -1 e vence empates" },
  INTIMIDATION: { name: "Intimidação", description: "Reduz ataque inimigo em -1 e vence empates" },
  KEEN_GAZE: { name: "Olhar Atento", description: "Nada pode diminuir o ataque desse Pokémon" },
  BIG_CHEST: { name: "Peitos Grandes", description: "Nada pode diminuir a defesa desse Pokémon" },

  // ── Boost por Status ──
  GUTS: { name: "Coragem", description: "Se este Pokémon estiver sobre qualquer status, todos seus ataques recebem +2" },
  DEFIANT: { name: "Desafiador", description: "Se esse Pokémon estiver sobre qualquer status, seu ataque recebe +2 por status" },
  UNSHAKABLE: { name: "Inabalável", description: "Se este Pokémon estiver sobre qualquer status, sua agilidade é aumentada em +2" },
  TANGLED_FEET: { name: "Pés Emaranhados", description: "Se esse Pokémon estiver com qualquer status, recebe +1 de agilidade" },

  // ── Ofensivas ──
  SNIPER: { name: "Franco Atirador", description: "Em qualquer ataque com rolagem crítica (1, 1) ou (5, 5) o Pokémon inimigo é derrotado instantaneamente" },
  TINTED_LENS: { name: "Lente colorida", description: "Nenhum ataque desse Pokémon sofrerá a penalidade de -2 pelo tipo do seu alvo" },
  SHEER_FORCE: { name: "Força Bruta", description: "Todo Ataque aprendido que inflinge qualquer status recebe +1 de ataque" },
  NO_GUARD: { name: "Sem Guarda", description: "Todo ataque que inflingir status em outro Pokémon, recebe +1" },
  HYPER_CUTTER: { name: "Hiper Cortador", description: "Escolha um ataque desse Pokémon para receber +2 pontos de ataque" },
  GLUTTONY: { name: "Gula", description: "Este Pokémon recebe +1 para um de seus ataques (escolha ao iniciar uma batalha contra um treinador ou selvagem) para cada estágio da linha evolutiva do Pokémon inimigo" },
  PURE_POWER: { name: "Força Pura", description: "Todo ataque que inflingir status desse Pokémon tem vantagem na rolagem" },
  RECKLESS: { name: "Imprudente", description: "Ataques com vantagem contra esse Pokémon não recebem o bônus de +2" },
  UNFAIR: { name: "Desonesto", description: "Vantagem por tipo recebem bonus de +3 ao invés de +2 para ataques desse Pokémon" },

  // ── Status Ofensivo ──
  EFFECT_SPORE: { name: "Esporos Mortais", description: "Ao iniciar uma batalha contra esse Pokémon, faça um teste normal para inflingir Paralizia, Sono ou Poison no Pokémon inimigo" },
  STATIC_AURA: { name: "Aura Estática", description: "Sempre que esse Pokémon entra em batalha ou sofre algum status, faça um teste normal para inflingir paralisia no Pokémon inimigo" },
  FLAME_BODY: { name: "Corpo em Chamas", description: "Ao iniciar uma batalha contra esse Pokémon, faça um teste normal para inflingir Burn no Pokémon inimigo" },
  CURSED_BODY: { name: "Corpo Amaldiçoado", description: "Antes de iniciar a batalha contra esse Pokémon, escolha um ataque do Pokémon inimigo para ficar indisponível até que esse Pokémon seja derrotado" },
  FOREWARN: { name: "Aviso Prévio", description: "Ao entrar na batalha, escolha um ataque do Pokémon inimigo para ficar indisponível até que este Pokémon seja derrotado" },
  STATIC: { name: "Static", description: "Empate causa paralisia" },

  // ── Suporte ──
  REGENERATOR: { name: "Regenerador", description: "Ao ser derrotado, este Pokémon fica indisponível até o fim da batalha, mas ele nunca fica nocauteado" },
  HARVEST: { name: "Colheita", description: "Qualquer cura de status ou de Pokémon nocauteado pode ser extendida a outro Pokémon da equipe" },
  FRIEND_GUARD: { name: "Guarda Amigável", description: "A qualquer momento que um status for inflingido a algum pokémon do seu time, você pode atribuí-lo a esse Pokémon" },
  CUTE_CHARM: { name: "Charme Fofo", description: "Sempre que esse Pokémon entrar em batalha, seu treinador pode fazer um teste normal para inflingir status. Se tiver sucesso, o Pokémon inimigo deve ser trocado por outro da equipe" },
  MAGIC_GUARD: { name: "Guarda Mágica", description: "Enquanto este Pokémon estiver em batalha, nenhum buff de aumento de ataque é aplicado" },
  NATURAL_CURE: { name: "Cura Natural", description: "Todo status inflingido a esse Pokémon é curado pós a batalha (os efeitos apenas são aplicados 1x)" },
  SERENE_GRACE: { name: "Graça Serena", description: "Todo status que esse Pokémon inflingir, em qualquer situação, tem vantagem na rolagem" },
  HEALER: { name: "Curandeiro", description: "Sempre que esse Pokémon batalha, vencendo ou perdendo, cure o status ou um Pokémon nocauteado da sua equipe" },

  // ── Imunidades Especiais ──
  LEVITATE: { name: "Levitate", description: "Este Pokémon se torna imune a ataques do tipo Terra" },
  DAMP: { name: "Úmido", description: "O pokémon com essa habilidade, veta a utilização de ataques aquáticos contra sua equipe" },
  WATER_ABSORB: { name: "Absorção Aquática", description: "Se este Pokémon enfrentar um Pokémon com ataque aquático, recebe +2 de defesa" },
  MAGNET_PULL: { name: "Atração Magnética", description: "Para cada Pokémon do tipo elétrico ou metálico da equipe inimiga ou da sua equipe (o Maior deve ser considerado), receba +1 de ataque para ataques elétricos" },
  ANALYTIC: { name: "Analítica", description: "Caso esse Pokémon tenha menos agilidade que o Pokémon inimigo, receba +2 de ataque para todos seus ataques" },
  WATER_VEIL: { name: "Véu Aquático", description: "Este Pokémon é imune a burning e confusão" },

  // ── Utilidade ──
  RUN_AWAY: { name: "Fuga", description: "O time com o Pokémon com essa habilidade, pode evitar qualquer batalha selvagem ao revelar o Pokémon encontrado" },
  EARLY_BIRD: { name: "Madrugador", description: "Todo teste para inflingir status de sono contra o time com esse Pokémon tem desvantagem" },
  JUSTIFIED: { name: "Justiça", description: "Este Pokémon recebe +1 de ataque para cada ataque do tipo Dark na equipe inimiga" },
  SELF_DESTRUCT: { name: "Auto Destruição", description: "Numa batalha, ao usar essa habilidade, seu próximo ataque receberá +3 de dano, porém esse Pokémon será nocauteado após a resolução" },
  PAY_DAY: { name: "Dia do pagamento", description: "Ganhe +1 moeda de ouro para cada batalha ganha" },

  // ── Combate Específico ──
  KEEN_EYE: { name: "Olho Aguçado", description: "Este Pokémon é completamente imune a modificadores que reduzam seus ataques (status, habilidades inatas e habilidades do tipo) (vantagem por tipagem não é afetada)" },
  IRON_FIST: { name: "Punho de Ferro", description: "Todos ataques de punho deste Pokémon recebem +1 de ataque" },
  TERRITORIAL: { name: "Domínio Territorial", description: "+1 ataque contra Pokémons do tipo Veneno e Terra" },

  // ── Genéricos Reutilizáveis ──
  NATURAL_RESILIENCE: { name: "Resiliência Natural", description: "Reduz penalidade de status" },
  ENDURANCE: { name: "Resistência", description: "Reduz penalidade de status" },
  DETERMINATION: { name: "Determinação", description: "Ignora penalidades leves" },
  SHIELD_DUST: { name: "Shield Dust", description: "Ignora efeitos secundários" },
  INSTINCT: { name: "Instinto", description: "+1 ataque" },
  SHED_SKIN: { name: "Shed Skin", description: "Ignora status" },
  ARENA_TRAP: { name: "Armadilha", description: "Testes de status contra esse Pokémon tem desvantagem" },
  TECHNICIAN: { name: "Técnico", description: "Este Pokémon recebe +1 de ataque para todos os ataques que inflingem status" },
  FUR_COAT: { name: "Casaco de Pelo", description: "+1 de defesa" },
  SCRAPPY: { name: "Desconexo", description: "Ao atacar Pokémons fantasmas, ignore suas imunidades e receba +2 de ataque" },
  PARENTAL_BOND: { name: "Vínculo Parental", description: "Todo ataque desse Pokémon com vantagem por tipo, terá vantagem na rolagem" },

  // ── Fúria (versões por Pokémon) ──
  RAGE_MANKEY: { name: "Fúria", description: "Este Pokémon recebe +4 para rolagens de ataque de falha crítica e +1 para rolagens críticas de sucesso" },
  RAGE_PRIMEAPE: { name: "Fúria", description: "Este Pokémon soma +8 aos dados de ataque sempre que rolar uma falha crítica" },

  // ── Para-Raios (versões) ──
  LIGHTNING_ROD_RAICHU: { name: "Para-Raio", description: "Sempre que qualquer ataque elétrico for utilizado em qualquer batalha no jogo, pegue um token de Paralisia e deixe ao lado desse Pokémon. Em qualquer batalha futura com esse Pokémon, você pode atribuir esse token ao oponente sem teste." },
  LIGHTNING_ROD_MAROWAK: { name: "Para-raios", description: "Para cada ataque elétrico usado pela sua equipe ou pela inimiga, esse Pokémon recebe +1 de dano (válido para o próximo ataque deste Pokémon)" },

  ILLUMINATE: { name: "Iluminar", description: "Este Pokémon cura o status de um Pokémon da equipe, sempre que vence uma batalha" },
  FILTER: { name: "Filtrar", description: "Todo ataque com vantagem nesse Pokémon, recebe +0 de dano ao invés de +2" },

  SWARM: { name: "Enxame", description: "Ataques do tipo inseto recebem +1 para cada bug vivo na equipe" },
  STEADFAST: { name: "Inabalável", description: "Se esse Pokémon estiver sob qualquer status, receba +2 de agilidade" },

  MOLD_BREAKER: { name: "Quebra Moldes", description: "Quando esse Pokémon entra em batalha, nenhuma habilidade inata ou de tipo de aplica, até que ele seja nocauteado" },

  MOXIE: { name: "Garra", description: "Para cada Pokémon nocauteado por esse Pokémon, adicione +1 de ataque até o fim da batalha" },

  ANGER_POINT: { name: "Ira", description: "Toda rolagem crítica (1,1) ou (5,5) de ataque sobre esse Pokémon, o faz receber +5 de ataque na resolução desse confronto do crítico" },

  RATTLED: { name: "Estrangulado", description: "A agilidade desse Pokémon é aumentada em +2 se estiver sendo atacado por um Pokémon do tipo fantasma, inseto ou dark, por por um ataque desses tipos" },

  IMPOSTER: { name: "Impostor", description: "Este Pokémon pode se tornar um Pokémon da equipe inimiga que foi nocauteado, por um turno da batalha" },

  ADAPTABILITY: { name: "Adaptabilidade", description: "Todo ataque do mesmo tipo que esse Pokémon, recebe +2 de ataque" },

  ANTICIPATION: { name: "Antecipação", description: "Todo ataque que tem vantagem pelo tipo contra esse Pokémon, recebe +1 ao invés de +2 de dano" },

  QUICK_FEET: { name: "Pés Velozes", description: "Sempre que esse Pokémon estiver sob qualquer status, receba +2 de agilidade e nenhum status diminui sua agilidade" },

  VOLT_ABSORB: { name: "Absorção Elétrica", description: "Este Pokémon recebe +2 de ataque para todos os ataques elétricos" },

  TRACE: { name: "Rastrear", description: "Este Pokémon pode usar uma habilidade inata ou de tipo de um Pokémon da equipe inimiga, 1x na batalha inteira contra este oponente"},

  DOWNLOAD: { name: "Download", description: "Todos ataques desse Pokémon recebem +1 de dano e ataques com vantagem somam +3 ao invés de +2"},

  PRESSURE: { name: "Pressão", description: "Todo ataque contra esse Pokémon fica dois turnos sem poder ser utilizado novamente" },

  TOUGH_CLAWS: { name: "Garras Dura", description: "Todo ataque desse Pokémon que faça alusão a contato com o mesmo, (mordida, corte com garras, contusão usando o próprio corpo) recebe +2 de dano" },

  IMMUNITY: { name: "Imunidade", description: "Este Pokémon é imune a qualquer status" },

  MARVEL_SCALE: { name: "Mudar de Pele", description: "Todo status inflingido nesse Pokémon só tem um turno de efeito. Pós esse turno ela está curada" },

  MULTISCALE: { name: "Múltiplas Escamas", description: "Se esse Pokémon não estiver sob qualquer status, sua defesa e agilidade são aumentadas em +1" },
};

const A = ABILITIES;

// ========================================================================
// HABILIDADES INATAS DOS POKÉMON
// Use ABILITIES.NOME para referenciar habilidades compartilhadas
// ========================================================================
export const innateAbilities: Record<string, ITalent[]> = {
  // ── Bulbasaur line ──
  bulbasaur: [A.OVERGROW, A.TOXIC_SPORES, A.NATURAL_RESILIENCE],
  ivysaur: [A.OVERGROW, A.TOXIC_SPORES, A.NATURAL_RESILIENCE],
  venusaur: [A.OVERGROW_SUPREME, A.TOXIC_SPORES, A.CHLOROPHYLL],

  // ── Charmander line ──
  charmander: [
    A.BLAZE,
    { name: "Chama Interior", description: "Empate favorece Charmander" },
    A.DETERMINATION,
  ],
  charmeleon: [
    { name: "Blaze+", description: "+1 Fire" },
    { name: "Fúria", description: "+1 ataque" },
    A.DETERMINATION,
  ],
  charizard: [A.BLAZE, A.SOLAR_POWER],

  // ── Squirtle line ──
  squirtle: [A.TORRENT, A.SHELL, A.ENDURANCE],
  wartortle: [A.TORRENT, A.SHELL, A.ENDURANCE],
  blastoise: [A.RAIN_DANCE, A.TORRENT, A.RAIN_DISH],

  // ── Caterpie line ──
  caterpie: [
    A.SHIELD_DUST, A.INSTINCT,
    { name: "Adaptação", description: "Bônus leve variável" },
  ],
  metapod: [A.SHED_SKIN, A.SHELL, A.ENDURANCE],
  butterfree: [A.COMPOUND_EYES, A.TINTED_LENS],

  // ── Weedle line ──
  weedle: [
    A.SHIELD_DUST,
    { name: "Veneno", description: "Poison mais forte" },
    A.INSTINCT,
  ],
  kakuna: [A.SHED_SKIN, A.SHELL, A.ENDURANCE],
  beedrill: [
    { name: "Enxame", description: "+1 em ataques do tipo Inseto" },
    A.SNIPER,
  ],

  // ── Pidgey line ──
  pidgey: [
    { name: "Keen Eye", description: "Ignora penalidades leves" },
    { name: "Leveza", description: "Reduz ataque inimigo em -1" },
    { name: "Instinto de Fuga", description: "Empate favorece Pidgey" },
  ],
  pidgeotto: [
    { name: "Keen Eye+", description: "Ignora penalidades" },
    { name: "Pressão Aérea", description: "Reduz defesa inimiga em -1" },
    { name: "Mobilidade", description: "+1 ataque" },
  ],
  pidgeot: [A.KEEN_GAZE, A.TANGLED_FEET, A.BIG_CHEST],

  // ── Rattata line ──
  rattata: [
    { name: "Guts", description: "Ignora penalidade de status" },
    { name: "Instinto Selvagem", description: "+1 ataque" },
    { name: "Desespero", description: "Empate favorece" },
  ],
  raticate: [
    { name: "Fuja", description: "Se esse Pokémon estiver sob qualquer status, recebe +2 de agilidade" },
    A.GUTS,
    { name: "Agitação", description: "Qualquer rolagem de ataque desse Pokémon tem vantagem" },
  ],

  // ── Spearow line ──
  spearow: [
    { name: "Keen Eye", description: "Ignora penalidade leve" },
    A.SNIPER,
  ],
  fearow: [A.KEEN_GAZE, A.SNIPER],

  // ── Ekans line ──
  ekans: [
    A.INTIMIDATE,
    { name: "Mudar de Pele", description: "Poison mais forte" },
    { name: "Desestabilizar", description: "Reduz penalidade recebida" },
  ],
  arbok: [
    A.INTIMIDATE,
    { name: "Mudar de Pele", description: "Todo status inflingido na Arbok só tem um turno de efeito. Pós esse turno ela está curada" },
    { name: "Desestabilizar", description: "Enquanto Arbok estiver em batalha, todas habilidades inatas do time inimigo são ignoradas" },
  ],

  // ── Pikachu line ──
  pikachu: [
    A.STATIC,
    { name: "Descarga", description: "Reduz defesa inimiga" },
    { name: "Agilidade Natural", description: "+1 ataque" },
  ],
  raichu: [A.ELECTRIC_BURST, A.STATIC_AURA, A.LIGHTNING_ROD_RAICHU],

  // ── Sandshrew line ──
  sandshrew: [
    { name: "Sand Veil", description: "Reduz ataque inimigo" },
    { name: "Casco de Areia", description: "+1 defesa" },
    { name: "Escavação", description: "Ignora penalidades" },
  ],
  sandslash: [A.SANDSTORM, A.SAND_RUSH, A.SAND_VEIL_DEFENSE],

  // ── Nidoran♀ line ──
  "nidoran-f": [
    { name: "Poison Point", description: "Quem perde recebe poison" },
    A.INSTINCT,
    { name: "Toxina", description: "Poison mais forte" },
  ],
  nidorina: [
    { name: "Poison Point+", description: "Quem perde recebe poison" },
    A.ENDURANCE,
    { name: "Pressão Tóxica", description: "Reduz defesa inimiga" },
  ],
  nidoqueen: [A.POISON_POINT, A.TERRITORIAL, A.SHEER_FORCE],

  // ── Nidoran♂ line ──
  "nidoran-m": [
    { name: "Poison Point", description: "Quem perde recebe poison" },
    { name: "Agressividade", description: "+1 ataque" },
    { name: "Veneno", description: "Poison mais forte" },
  ],
  nidorino: [
    { name: "Poison Point+", description: "Quem perde recebe poison" },
    { name: "Impulso", description: "+1 ataque" },
    { name: "Pressão", description: "Reduz defesa inimiga" },
  ],
  nidoking: [A.POISON_POINT, A.TERRITORIAL, A.SHEER_FORCE],

  // ── Clefairy line ──
  clefairy: [
    { name: "Magic Guard", description: "Ignora efeitos negativos indiretos" },
    { name: "Encanto", description: "Reduz ataque inimigo" },
    { name: "Sorte", description: "Empate favorece" },
  ],
  clefable: [A.CUTE_CHARM, A.MAGIC_GUARD, A.FRIEND_GUARD],

  // ── Vulpix line ──
  vulpix: [A.FLAMES, A.SUNNY_DAY],
  ninetales: [A.SUNNY_DAY, A.FLAMES],

  // ── Jigglypuff line ──
  jigglypuff: [
    { name: "Canto", description: "Reduz valor inimigo (sleep-like)" },
    { name: "Corpo Inflado", description: "+1 defesa" },
    { name: "Charme", description: "Reduz ataque inimigo" },
  ],
  wigglytuff: [
    { name: "Canto", description: "Trate qualquer ataque seu com o status de sleep" },
    { name: "Domínio Territorial", description: "+1 de ataque contra Pokémons do tipo Normal ou Fada" },
    { name: "Resistência", description: "+1 defesa" },
  ],

  // ── Zubat line ──
  zubat: [A.INNER_FOCUS, A.INFILTRATOR],
  golbat: [A.INNER_FOCUS, A.INFILTRATOR],

  // ── Oddish line ──
  oddish: [A.CHLOROPHYLL, A.RUN_AWAY],
  gloom: [A.CHLOROPHYLL, A.STENCH, A.TOXIN],
  vileplume: [A.CHLOROPHYLL, A.TOXIC_CLOUD, A.EFFECT_SPORE],

  // ── Paras line ──
  paras: [A.EFFECT_SPORE, A.DRY_SKIN, A.DAMP],
  parasect: [A.EFFECT_SPORE, A.DRY_SKIN, A.DAMP],

  // ── Venonat line ──
  venonat: [
    A.DUST_SHIELD,
    { name: "Lentes coloridas", description: "Reduz valor inimigo" },
    A.WONDER_SKIN,
  ],
  venomoth: [A.DUST_SHIELD, A.TINTED_LENS, A.WONDER_SKIN],

  // ── Diglett line ──
  diglett: [
    A.SAND_VEIL, A.ARENA_TRAP,
    { name: "Força da Areia", description: "Se tempestade de areia estiver ativa, todos ataques de Areia recebem +2" },
  ],
  dugtrio: [A.SANDSTORM, A.SAND_VEIL, A.ARENA_TRAP, A.SAND_FORCE],

  // ── Meowth line ──
  meowth: [A.PAY_DAY, A.LIMBER, A.TECHNICIAN, A.FUR_COAT],
  persian: [
    { name: "Limber", description: "Ignora paralisia" },
    { name: "Elegância", description: "Empate favorece" },
    A.FUR_COAT,
  ],

  // ── Psyduck line ──
  psyduck: [A.DAMP, A.RAIN_DANCE, A.CLOUD_NINE, A.SWIFT_SWIM],
  golduck: [A.DAMP, A.RAIN_DANCE, A.CLOUD_NINE, A.SWIFT_SWIM],

  // ── Mankey line ──
  mankey: [A.VITAL_SPIRIT, A.RAGE_MANKEY, A.DEFIANT],
  primeape: [A.VITAL_SPIRIT, A.RAGE_PRIMEAPE, A.DEFIANT],

  // ── Growlithe line ──
  growlithe: [A.INTIMIDATION, A.SUNNY_DAY, A.JUSTIFIED],
  arcanine: [A.INTIMIDATION, A.SUNNY_DAY, A.JUSTIFIED],

  // ── Poliwag line ──
  poliwag: [
    { name: "Water Absorb", description: "Ignora penalidades Water" },
    { name: "Elasticidade", description: "Reduz ataque inimigo" },
    { name: "Fluxo", description: "+1 ataque" },
  ],
  poliwhirl: [
    { name: "Water Absorb+", description: "Ignora penalidades Water" },
    { name: "Confusão", description: "Reduz valor inimigo" },
    { name: "Pressão", description: "+1 ataque" },
  ],
  poliwrath: [A.WATER_ABSORB, A.DAMP, A.SWIFT_SWIM],

  // ── Abra line ──
  abra: [A.SYNCHRONIZE, A.INNER_FOCUS, A.MAGIC_BARRIER],
  kadabra: [A.SYNCHRONIZE, A.INNER_FOCUS, A.MAGIC_BARRIER],
  alakazam: [A.SYNCHRONIZE, A.INNER_FOCUS, A.MAGIC_BARRIER],

  // ── Machop line ──
  machop: [A.GUTS, A.NO_GUARD, A.UNSHAKABLE],
  machoke: [A.GUTS, A.NO_GUARD, A.UNSHAKABLE],
  machamp: [A.GUTS, A.NO_GUARD, A.UNSHAKABLE],

  // ── Bellsprout line ──
  bellsprout: [
    { name: "Clorofila", description: "+1 ataque" },
    { name: "Veneno", description: "Poison forte" },
    { name: "Flexibilidade", description: "Reduz penalidade" },
  ],
  weepinbell: [
    { name: "Clorofila+", description: "+1 ataque" },
    { name: "Armadilha", description: "Reduz defesa inimiga" },
    { name: "Toxina", description: "Poison dobrado" },
  ],
  victreebel: [A.CHLOROPHYLL, A.GLUTTONY, A.TOXIC_DOMAIN],

  // ── Tentacool line ──
  tentacool: [A.CLEAR_BODY, A.LIQUID_OOZE, A.DRIZZLE],
  tentacruel: [A.CLEAR_BODY, A.LIQUID_OOZE, A.DRIZZLE],

  // ── Geodude line ──
  geodude: [A.ROCK_HEAD, A.STURDY, A.SAND_VEIL],
  graveler: [A.ROCK_HEAD, A.STURDY, A.SAND_VEIL],
  golem: [A.ROCK_HEAD, A.STURDY, A.SAND_VEIL],

  // ── Ponyta line ──
  ponyta: [
    { name: "Run Away", description: "Ignora penalidades" },
    { name: "Chama", description: "+1 Fire" },
    { name: "Velocidade", description: "Reduz ataque inimigo" },
  ],
  rapidash: [A.SUNNY_DAY, A.RUN_AWAY, A.FLAME_BODY],

  // ── Slowpoke line ──
  slowpoke: [A.OWN_TEMPO, A.REGENERATOR],
  slowbro: [A.OWN_TEMPO, A.REGENERATOR],

  // ── Magnemite line ──
  magnemite: [A.MAGNET_PULL, A.STURDY, A.ANALYTIC],
  magneton: [A.MAGNET_PULL, A.STURDY, A.ANALYTIC],

  // ── Farfetch'd ──
  farfetchd: [A.KEEN_GAZE, A.INNER_FOCUS, A.DEFIANT],

  // ── Doduo line ──
  doduo: [
    { name: "Run Away", description: "Ignora penalidades" },
    { name: "Ataque Duplo", description: "+1 ataque" },
    { name: "Instinto", description: "Reduz ataque inimigo" },
  ],
  dodrio: [
    A.RUN_AWAY,
    A.EARLY_BIRD,
    { name: "Pés Emaranhados", description: "Se esse Pokémon estiver sob qualquer status, recebe +2 de agilidade por status" },
  ],

  // ── Seel line ──
  seel: [A.RAIN_DANCE, A.THICK_FAT, A.HYDRATION, A.ICE_BODY],
  dewgong: [A.THICK_FAT, A.HYDRATION, A.ICE_BODY],

  // ── Grimer line ──
  grimer: [A.BAD_STENCH, A.STICKY_HOLD, A.POISON_TOUCH],
  muk: [A.BAD_STENCH, A.STICKY_HOLD, A.POISON_TOUCH],

  // ── Shellder line ──
  shellder: [
    A.SHELL_ARMOR,
    { name: "Vínculo de Habilidade", description: "+1 defesa" },
    { name: "Sobretudo", description: "+1 ataque" },
  ],
  cloyster: [
    A.SHELL_ARMOR,
    A.THORNS,
    { name: "Blindagem", description: "Todos modificadores de clima são ignorados por esse Pokémon enquanto estiver em batalha" },
  ],

  // ── Gastly line ──
  gastly: [A.FOG, A.LEVITATE],
  haunter: [A.FOG, A.LEVITATE],
  gengar: [A.FOG, A.LEVITATE, A.CURSED_BODY],

  // ── Onix / Steelix ──
  onix: [A.SANDSTORM, A.ROCK_HEAD, A.STURDY, A.WEAK_ARMOR],
  steelix: [A.SANDSTORM, A.ROCK_HEAD, A.STURDY, A.WEAK_ARMOR, A.PURE_POWER],

  // ── Drowzee line ──
  drowzee: [A.INNER_FOCUS, A.INSOMNIA, A.FOREWARN],
  hypno: [A.INNER_FOCUS, A.INSOMNIA, A.FOREWARN],

  // ── Krabby line ──
  krabby: [A.RAIN_DANCE, A.HYPER_CUTTER, A.SHELL_ARMOR, A.SHEER_FORCE],
  kingler: [A.RAIN_DANCE, A.HYPER_CUTTER, A.SHELL_ARMOR, A.SHEER_FORCE],

  // ── Voltorb line ──
  voltorb: [A.SOUNDPROOF, A.STATIC_AURA, A.SELF_DESTRUCT],
  electrode: [A.ELECTRIC_STORM, A.SOUNDPROOF, A.STATIC_AURA, A.SELF_DESTRUCT],

  // ── Exeggcute line ──
  exeggcute: [A.CHLOROPHYLL, A.HARVEST],
  exeggutor: [A.CHLOROPHYLL, A.HARVEST],

  // ── Cubone line ──
  cubone: [A.SANDSTORM, A.ROCK_HEAD, A.BATTLE_ARMOR],
  marowak: [A.SANDSTORM, A.ROCK_HEAD, A.LIGHTNING_ROD_MAROWAK, A.BATTLE_ARMOR],

  // ── Hitmonlee / Hitmonchan ──
  hitmonlee: [A.LIMBER, A.RECKLESS, A.UNFAIR],
  hitmonchan: [A.KEEN_EYE, A.IRON_FIST, A.INNER_FOCUS],

  // ── Lickitung ──
  lickitung: [A.OWN_TEMPO, A.CLOUD_NINE, A.OBLIVIOUS],

  // ── Koffing / Weezing ──
  koffing: [A.LEVITATE],
  weezing: [A.LEVITATE, A.SELF_DESTRUCT],

  // ================================================================
  // A PARTIR DAQUI: habilidades refeitas usando o catálogo acima
  // ================================================================

  // ── Rhyhorn line ──
  rhyhorn: [A.SANDSTORM, A.ROCK_HEAD, A.LIGHTNING_ROD_MAROWAK],
  rhydon: [A.ROCK_HEAD, A.LIGHTNING_ROD_MAROWAK, A.BATTLE_ARMOR],

  // ── Chansey ──
  chansey: [A.NATURAL_CURE, A.SERENE_GRACE, A.HEALER],

  // ── Tangela ──
  tangela: [A.CHLOROPHYLL, A.REGENERATOR, A.LEAF_ARMOR],

  // ── Kangaskhan ──
  kangaskhan: [A.EARLY_BIRD, A.SCRAPPY, A.INNER_FOCUS, A.PARENTAL_BOND],

  // ── Horsea line ──
  horsea: [A.DAMP, A.SWIFT_SWIM],
  seadra: [A.RAIN_DANCE, A.DAMP, A.POISON_POINT, A.SNIPER],

  // ── Goldeen line ──
  goldeen: [A.RAIN_DANCE, A.SWIFT_SWIM, A.RUN_AWAY, A.LIGHTNING_ROD_MAROWAK, A.WATER_VEIL],
  seaking: [A.RAIN_DANCE, A.SWIFT_SWIM, A.RUN_AWAY, A.LIGHTNING_ROD_MAROWAK, A.WATER_VEIL],

  // ── Staryu line ──
  staryu: [A.REGENERATOR, A.ANALYTIC, A.ILLUMINATE],
  starmie: [A.REGENERATOR, A.ANALYTIC, A.HARVEST],

  // ── Mr. Mime ──
  "mr-mime": [A.SOUNDPROOF, A.FILTER, A.TECHNICIAN],

  // ── Scyther ──
  scyther: [A.SWARM, A.TECHNICIAN, A.STEADFAST],

  // ── Jynx ──
  jynx: [A.OBLIVIOUS, A.FOREWARN, A.DRY_SKIN],

  // ── Electabuzz ──
  electabuzz: [A.STATIC_AURA, A.VITAL_SPIRIT, A.DEFIANT],

  // ── Magmar ──
  magmar: [A.SUNNY_DAY, A.FLAME_BODY, A.VITAL_SPIRIT],

  // ── Pinsir ──
  pinsir: [A.MOXIE, A.HYPER_CUTTER, A.MOLD_BREAKER],

  // ── Tauros ──
  tauros: [A.INTIMIDATION, A.SHEER_FORCE, A.ANGER_POINT],

  // ── Magikarp line ──
  magikarp: [A.SWIFT_SWIM, A.RATTLED],
  gyarados: [A.RAIN_DANCE, A.INTIMIDATION, A.MOXIE],

  // ── Lapras ──
  lapras: [A.HAIL, A.WATER_ABSORB, A.SHELL_ARMOR, A.HYDRATION],

  // ── Ditto ──
  ditto: [A.SYNCHRONIZE, A.LIMBER, A.IMPOSTER],

  // ── Eevee + Eeveelutions ──
  eevee: [A.RUN_AWAY, A.ADAPTABILITY, A.ANTICIPATION],
  vaporeon: [A.RAIN_DANCE, A.WATER_ABSORB, A.HYDRATION],
  jolteon: [A.STATIC_AURA, A.LIGHTNING_ROD_RAICHU, A.QUICK_FEET],
  flareon: [A.SUNNY_DAY, A.FLAMES, A.GUTS],

  // ── Porygon ──
  porygon: [A.ANALYTIC, A.TRACE, A.DOWNLOAD],

  // ── Omanyte line ──
  omanyte: [A.SHELL_ARMOR, A.STURDY, A.SWIFT_SWIM],
  omastar: [A.SHELL_ARMOR, A.STURDY, A.RAIN_DANCE, A.ROCK_HEAD],

  // ── Kabuto line ──
  kabuto: [A.SWIFT_SWIM, A.BATTLE_ARMOR, A.ROCK_HEAD],
  kabutops: [A.SWIFT_SWIM, A.BATTLE_ARMOR, A.SNIPER],

  // ── Aerodactyl ──
  aerodactyl: [ A.ROCK_HEAD, A.PRESSURE, A.TOUGH_CLAWS],

  // ── Snorlax ──
  snorlax: [A.THICK_FAT, A.OWN_TEMPO, A.GLUTTONY, A.IMMUNITY],

  // ── Legendary Birds ──
  articuno: [A.HAIL, A.ICE_BODY, A.INTIMIDATION],
  zapdos: [A.ELECTRIC_STORM, A.STATIC_AURA, A.INTIMIDATION],
  moltres: [A.SUNNY_DAY, A.FLAME_BODY, A.INTIMIDATION],

  // ── Dratini line ──
  dratini: [A.SHED_SKIN, A.MARVEL_SCALE],
  dragonair: [A.SHED_SKIN, A.MARVEL_SCALE],
  dragonite: [A.INNER_FOCUS, A.MULTISCALE],

  // ── Mewtwo / Mew ──
  mewtwo: [A.PRESSURE, A.INSOMNIA, A.STEADFAST],
  mew: [A.SYNCHRONIZE],
};


/**
 ☀️ SUNNY DAY (Sol forte)
🎯 Efeito (adaptado)
🔥 Fire: +1 ataque
🌿 Grass: +1 ataque
💧 Water: -1 ataque


 RAIN DANCE (Chuva)
💧 Water: +1 ataque
⚡ Electric: +1 ataque
🔥 Fire: -1 ataque


SANDSTORM (Tempestade de areia)
🪨 Rock: +1 defesa
⚙️ Steel: +1 defesa
🌍 Ground: ignora penalidades leves


 NÉVOA 
👻 Ghost: +1 ataque
🖤 Dark: +1 ataque
🧠 Psychic: -1 ataque


HAIL (Granizo)
🧊 Ice: +1 ataque


TEMPESTADE ELÉTRICA
⚡ Electric: +1 ataque
🪶 Flying: +1 ataque
🌍 Ground: -1 ataque



 * 
 */
