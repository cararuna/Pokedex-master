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
      //{ name: "Raiz Firme", description: "Qualquer rolagem para inflingir status contra esse pokémon tem desvantagem" },
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
      //{ name: "Tempesta de Areia", description: "Sumone uma tempeste de areia até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
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

export const innateAbilities: Record<string, ITalent[]> = {
  bulbasaur: [
    { name: "Overgrow", description: "+1 em ataques Grass" },
    { name: "Esporos Tóxicos", description: "Poison aplica 2 stacks" },
    { name: "Resiliência Natural", description: "Reduz penalidade de status" },
  ],
  ivysaur: [
    { name: "Overgrow", description: "+1 em ataques Grass" },
    { name: "Esporos Tóxicos", description: "Poison aplica 2 stacks" },
    { name: "Resiliência Natural", description: "Reduz penalidade de status" },
  ],
  venusaur: [
    { name: "Overgrow Supremo", description: "+1 em ataques Grass" },
    { name: "Esporos Tóxicos", description: "Poison aplica 2 stacks" },
    { name: "Clorofila", description: "+2 de agilidade se dia ensolarado estiver ativo" },
  ],
  charmander: [
    { name: "Blaze", description: "+1 Fire" },
    { name: "Chama Interior", description: "Empate favorece Charmander" },
    { name: "Determinação", description: "Ignora penalidades leves" },
  ],
  charmeleon: [
    { name: "Blaze+", description: "+1 Fire" },
    { name: "Fúria", description: "+1 ataque" },
    { name: "Determinação", description: "Ignora penalidades leves" },
  ],
  charizard: [
    { name: "Blaze", description: "+1 em ataques Fire" },
    { name: "Poder Solar", description: "+1 em todos ataques se dia ensolarado estiver ativo" },
  ],
  squirtle: [
    { name: "Torrent", description: "+1 Water" },
    { name: "Casco", description: "+1 defesa" },
    { name: "Resistência", description: "Reduz penalidade de status" },
  ],
  wartortle: [
    { name: "Torrent+", description: "+1 em ataques do tipo Água" },
    { name: "Casco", description: "+1 defesa" },
    { name: "Resistência", description: "Reduz penalidade de status" },
  ],
  blastoise: [
    { name: "Dança da Chuva", description: "Sumone uma chuva até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Torrent", description: "+1 em ataques do tipo Água" },
    { name: "Chuvisco", description: "Se estiver chovendo, esse Pokémon recebe +1 de defesa" },
  ],
  caterpie: [
    { name: "Shield Dust", description: "Ignora efeitos secundários" },
    { name: "Instinto", description: "+1 ataque" },
    { name: "Adaptação", description: "Bônus leve variável" },
  ],
  metapod: [
    { name: "Shed Skin", description: "Ignora status" },
    { name: "Casco", description: "+1 defesa" },
    { name: "Resistência", description: "Reduz penalidade" },
  ],
  butterfree: [
    { name: "Olhos Compostos", description: "+1 em todos ataques inseto/voador" },
    { name: "Lente colorida", description: "Nenhum ataque desse Pokémon sofrerá a penalidade de -2 pelo tipo do seu alvo" },
  ],
  weedle: [
    { name: "Shield Dust", description: "Ignora efeitos secundários" },
    { name: "Veneno", description: "Poison mais forte" },
    { name: "Instinto", description: "+1 ataque" },
  ],
  kakuna: [
    { name: "Shed Skin", description: "Ignora status" },
    { name: "Casco", description: "+1 defesa" },
    { name: "Resistência", description: "Reduz penalidade" },
  ],
  beedrill: [
    { name: "Enxame", description: "+1 em ataques do tipo Inseto" },
    { name: "Franco Atirador", description: "Em qualquer ataque com rolagem crítica (1, 1) ou (5, 5) o Pokémon inimigo é derrotado instantaneamente" },
  ],
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
  pidgeot: [
    { name: "Olhar Atento", description: "Nada pode diminuir o ataque desse Pokémon" },
    { name: "Pés Emaranhados", description: "Se esse Pokémon estiver com qualquer status, recebe +1 de agilidade" },
    { name: "Peitos Grandes", description: "Nada pode diminuir a defesa desse Pokémon" },
  ],
  rattata: [
    { name: "Guts", description: "Ignora penalidade de status" },
    { name: "Instinto Selvagem", description: "+1 ataque" },
    { name: "Desespero", description: "Empate favorece" },
  ],
  raticate: [
    { name: "Fuja", description: "Se esse Pokémon estiver sob qualquer status, recebe +2 de agilidade" },
    { name: "Coragem", description: "Se esse Pokémon estiver sob qualquer status, recebe +2 para todos ataques" },
    { name: "Agitação", description: "Qualquer rolagem de ataque desse Pokémon tem vantagem" },
  ],
  spearow: [
    { name: "Keen Eye", description: "Ignora penalidade leve" },
    { name: "Franco Atirador", description: "Em qualquer ataque com rolagem crítica (1, 1) ou (5, 5) o Pokémon inimigo é derrotado instantaneamente" },
  ],
  fearow: [
    { name: "Olhar Atento", description: "Nada pode diminuir o ataque desse Pokémon" },
    { name: "Franco Atirador", description: "Em qualquer ataque com rolagem crítica (1, 1) ou (5, 5) o Pokémon inimigo é derrotado instantaneamente" },
  ],
  ekans: [
    { name: "Intimidar", description: "Reduz ataque inimigo em -1 e vence empates" },
    { name: "Mudar de Pele", description: "Poison mais forte" },
    { name: "Desestabilizar", description: "Reduz penalidade recebida" },
  ],
  arbok: [
    { name: "Intimidar", description: "Reduz ataque inimigo em -1 e vence empates" },
    { name: "Mudar de Pele", description: "Todo status inflingido na Arbok só tem um turno de efeito. Pós esse turno ela está curada" },
    { name: "Desestabilizar", description: "Enquanto Arbok estiver em batalha, todas habilidades inatas do time inimigo são ignoradas" },
  ],
  pikachu: [
    { name: "Static", description: "Empate causa paralisia" },
    { name: "Descarga", description: "Reduz defesa inimiga" },
    { name: "Agilidade Natural", description: "+1 ataque" },
  ],
  raichu: [
    { name: "Explosão Elétrica", description: "+1 em ataques do tipo Elétrico" },
    { name: "Aura Estática", description: "Sempre que esse Pokémon entra em batalha ou sofre algum status, faça um teste normal para inflingir paralisia no Pokémon inimigo" },
    { name: "Para-Raio", description: "Sempre que qualquer ataque elétrico for utilizado em qualquer batalha no jogo, pegue um token de Paralisia e deixe ao lado do Raichu. Em qualquer batalha futura com esse Pokémon, você pode atribuir esse token ao oponente do Raichu sem teste." },
  ],
  sandshrew: [
    { name: "Sand Veil", description: "Reduz ataque inimigo" },
    { name: "Casco de Areia", description: "+1 defesa" },
    { name: "Escavação", description: "Ignora penalidades" },
  ],
  sandslash: [
    { name: "Tempestade de Areia", description: "Sumone uma tempeste de areia até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Corrida de Areia", description: "+2 de agilidade se a tempestade de areia estiver ativa" },
    { name: "Véu de Areia", description: "+2 de defesa se a tempestade de areia estiver ativa" },
  ],
  "nidoran-f": [
    { name: "Poison Point", description: "Quem perde recebe poison" },
    { name: "Instinto", description: "+1 ataque" },
    { name: "Toxina", description: "Poison mais forte" },
  ],
  nidorina: [
    { name: "Poison Point+", description: "Quem perde recebe poison" },
    { name: "Resistência", description: "Reduz status" },
    { name: "Pressão Tóxica", description: "Reduz defesa inimiga" },
  ],
  nidoqueen: [
    { name: "Ponto Venenoso", description: "Sempre que esse Pokémon entra em batalha ou sofre algum status, faça um teste normal para inflingir Poison no Pokémon inimigo" },
    { name: "Domínio Territorial", description: "+1 ataque contra Pokémons do tipo Veneno e Terra" },
    { name: "Força Bruta", description: "Todo Ataque aprendido que inflinge qualquer status recebe +1 de ataque" },
  ],
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
  nidoking: [
    { name: "Ponto Venenoso", description: "Sempre que esse Pokémon entra em batalha ou sofre algum status, faça um teste normal para inflingir Poison no Pokémon inimigo" },
    { name: "Domínio Territorial", description: "+1 ataque contra Pokémons do tipo Veneno e Terra" },
    { name: "Força Bruta", description: "Todo Ataque aprendido que inflinge qualquer status recebe +1 de ataque" },
  ],
  clefairy: [
    { name: "Magic Guard", description: "Ignora efeitos negativos indiretos" },
    { name: "Encanto", description: "Reduz ataque inimigo" },
    { name: "Sorte", description: "Empate favorece" },
  ],
  clefable: [
    { name: "Charme Fofo", description: "Sempre que esse Pokémon entrar em batalha, seu treinador pode fazer um teste normal para inflingir status. Se tiver sucesso, o Pokémon inimigo deve ser trocado por outro da equipe" },
    { name: "Guarda Mágica", description: "Enquanto este Pokémon estiver em batalha, nenhum buff de aumento de ataque é aplicado" },
    { name: "Guarda Amigável", description: "A qualquer momento que um status for inflingido a algum pokémon do seu time, você pode atribuí-lo a esse Pokémon" },
  ],
  vulpix: [
    { name: "Chamas", description: "+1 ataque Fire" },
    { name: "Dia ensolarado", description: "Ao entrar em batalha, sumone um dia ensolarado até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
  ],
  ninetales: [
    { name: "Dia ensolarado", description: "Ao entrar em batalha, sumone um dia ensolarado até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Chamas", description: "+1 ataque Fire" },
  ],
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
  zubat: [
    { name: "Foco Interno", description: "Este Pokémon é imune a status de confusão, sono e veneno" },
    { name: "Infiltrador", description: "Qualquer status inflingido a esse Pokémon tem desvantagem" },
  ],
  golbat: [
    { name: "Foco Interno", description: "Este Pokémon é imune a status de confusão, sono e veneno" },
    { name: "Infiltrador", description: "Qualquer status inflingido a esse Pokémon tem desvantagem" },
  ],
  oddish: [
    { name: "Clorofila", description: "+2 de agilidade se dia ensolarado estiver ativo" },
    { name: "Fuga", description: "O time com o Pokémon com essa habilidade, pode evitar qualquer batalha selvagem ao revelar o Pokémon encontrado" },
  ],
  gloom: [
    { name: "Clorofila", description: "+2 de agilidade se dia ensolarado estiver ativo" },
    { name: "Odor Forte", description: "Todo teste de status contra esse Pokémon tem desvantagem" },
    { name: "Toxina", description: "Quando esse Pokémon inflingir Poison a um inimigo, o mesmo recebe dois Tokens de Poison (efeitos dobrados)" },
  ],
  vileplume: [
    { name: "Clorofila", description: "+2 de agilidade se dia ensolarado estiver ativo" },
    { name: "Nuvem Tóxica", description: "Quando esse Pokémon inflingir Poison a um inimigo, escolha outro Pokémon da equipe para receber um token de Poison também" },
    { name: "Esporos Mortais", description: "Ao iniciar uma batalha contra esse Pokémon, faça um teste normal para inflingir Paralizia, Sono ou Poison no Pokémon inimigo" },
  ],
  paras: [
    { name: "Esporos Mortais", description: "Ao iniciar uma batalha contra esse Pokémon, faça um teste normal para inflingir Paralizia, Sono ou Poison no Pokémon inimigo" },
    { name: "Pele Seca", description: "Se dança da chuva estiver ativa ou qualquer ataque de água for utilizado por algum Pokémon de sua equipe, esse Pokémon recebe +1 de defesa (Sem limites/o valor da defesa reseta ao acabar a batalha)" },
    { name: "Úmido", description: "O pokémon com essa habilidade, veta a utilização de ataques aquáticos contra sua equipe" },
  ],
  'parasect': [
    { name: "Esporos Mortais", description: "Ao iniciar uma batalha contra esse Pokémon, faça um teste normal para inflingir Paralizia, Sono ou Poison no Pokémon inimigo" },
    { name: "Pele Seca", description: "Se dança da chuva estiver ativa ou qualquer ataque de água for utilizado por algum Pokémon de sua equipe, esse Pokémon recebe +1 de defesa (Sem limites/o valor da defesa reseta ao acabar a batalha)" },
    { name: "Úmido", description: "O pokémon com essa habilidade, veta a utilização de ataques aquáticos contra sua equipe" },
  ],
  venonat: [
    { name: "Escudo de pó", description: "+1 de defesa" },
    { name: "Lentes coloridas", description: "Reduz valor inimigo" },
    { name: "Pele Maravilhosa", description: "Todo teste de status contra esse Pokémon tem desvantagem" },
  ],
  venomoth: [
    { name: "Escudo de pó", description: "+1 de defesa" },
    { name: "Lente colorida", description: "Nenhum ataque desse Pokémon sofrerá a penalidade de -2 pelo tipo do seu alvo" },
    { name: "Pele Maravilhosa", description: "Todo teste de status contra esse Pokémon tem desvantagem" },
  ],
  diglett: [
    { name: "Véu de Areia", description: "Se tempestade de areia estiver ativa, +2 de agilidade" },
    { name: "Armadilha", description: "Testes de status contra esse Pokémon tem desvantagem" },
    { name: "Força da Areia", description: "Se tempestade de areia estiver ativa, todos ataques de Areia recebem +2" },
  ],
  dugtrio: [
    { name: "Tempestade de Areia", description: "Sumone uma tempeste de areia até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Véu de Areia", description: "Se tempestade de areia estiver ativa, +2 de agilidade" },
    { name: "Armadilha", description: "Testes de status contra esse Pokémon tem desvantagem" },
    { name: "Força da Areia", description: "Se tempestade de areia estiver ativa, todos ataques de Areia e Pedra desse Pokémon recebem +2" },
  ],
  meowth: [
    { name: "Dia do pagamento", description: "Ganhe +1 moeda de ouro para cada batalha ganha" },
    { name: "Flexível", description: "Este Pokémon é imune a status de paralisia" },
    { name: "Técnico", description: "Este Pokémon recebe +1 de ataque para todos os ataques que inflingem status" },
    { name: "Casaco de Pelo", description: "+ de defesa" },
  ],
  persian: [
    { name: "Limber", description: "Ignora paralisia" },
    { name: "Elegância", description: "Empate favorece" },
    { name: "Casaco de Pelo", description: "+ de defesa" },
  ],
  psyduck: [
    { name: "Úmido", description: "O pokémon com essa habilidade, veta a utilização de ataques aquáticos contra sua equipe" },
    { name: "Dança da Chuva", description: "Sumone uma chuva até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Núvem Nove", description: "Enquanto este Pokémon estiver saudável em uma equipe, nenhum efeito de clima deverá ser aplicado" },
    { name: "Nado Rápido", description: "Se dança da chuva estiver ativa, este Pokémon recebe +2 de agilidade" },
  ],
  golduck: [
    { name: "Úmido", description: "O pokémon com essa habilidade, veta a utilização de ataques aquáticos contra sua equipe" },
    { name: "Dança da Chuva", description: "Sumone uma chuva até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Núvem Nove", description: "Enquanto este Pokémon estiver saudável em uma equipe, nenhum efeito de clima deverá ser aplicado" },
    { name: "Nado Rápido", description: "Se dança da chuva estiver ativa, este Pokémon recebe +2 de agilidade" },
  ],
  mankey: [
    { name: "Espírito Vital", description: "Este Pokémon é imune a status de sono" },
    { name: "Fúria", description: "Este Pokémon recebe +4 para rolagens de ataque de falha crítica e +1 para rolagens críticas de sucesso" },
    { name: "Desafiador", description: "Se esse Pokémon estiver sobre qualquer status, seu ataque recebe +2 por status" },
  ],
  primeape: [
    { name: "Espírito Vital", description: "Este Pokémon é imune a status de sono" },
    { name: "Fúria", description: "Este Pokémon soma +8 aos dados de ataque sempre que rolar uma falha crítica" },
    { name: "Desafiador", description: "Se esse Pokémon estiver sobre qualquer status, seu ataque recebe +2 por status" },
  ],
  growlithe: [
    { name: "Intimidação", description: "Reduz ataque inimigo em -1 e vence empates" },
    { name: "Dia ensolarado", description: "Ao entrar em batalha, sumone um dia ensolarado até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Justiça", description: "Este Pokémon recebe +1 de ataque para cada ataque do tipo Dark na equipe inimiga" },
  ],
  arcanine: [
    { name: "Intimidação", description: "Reduz ataque inimigo em -1 e vence empates" },
    { name: "Dia ensolarado", description: "Ao entrar em batalha, sumone um dia ensolarado até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Justiça", description: "Este Pokémon recebe +1 de ataque para cada ataque do tipo Dark na equipe inimiga" },
  ],
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
  poliwrath: [
    { name: "Absorção Aquática", description: "Se este Pokémon enfrentar um Pokémon com ataque aquático, recebe +2 de defesa" },
    { name: "Úmido", description: "O pokémon com essa habilidade, veta a utilização de ataques aquáticos contra sua equipe" },
    { name: "Nado Rápido", description: "Se dança da chuva estiver ativa, este Pokémon recebe +2 de agilidade" },
  ],
  abra: [
    { name: "Sincronizar", description: "Reflete todo e qualquer status inflingido a esse Pokémon, ignorando toda e qualquer imunidade" },
    { name: "Foco Interno", description: "Este Pokémon é imune a status de confusão, sono e veneno" },
    { name: "Defesa Mágica", description: "Este Pokémon só pode ser alvo de ataques que não inflingem status" },
  ],
  kadabra: [
    { name: "Sincronizar", description: "Reflete todo e qualquer status inflingido a esse Pokémon, ignorando toda e qualquer imunidade" },
    { name: "Foco Interno", description: "Este Pokémon é imune a status de confusão, sono e veneno" },
    { name: "Defesa Mágica", description: "Este Pokémon só pode ser alvo de ataques que não inflingem status" },
  ],
  alakazam: [
    { name: "Sincronizar", description: "Reflete todo e qualquer status inflingido a esse Pokémon, ignorando toda e qualquer imunidade" },
    { name: "Foco Interno", description: "Este Pokémon é imune a status de confusão, sono e veneno" },
    { name: "Defesa Mágica", description: "Este Pokémon só pode ser alvo de ataques que não inflingem status" },
  ],
  machop: [
    { name: "Coragem", description: "Se este Pokémon estiver sobre qualquer status, todos seus ataques recebem +2" },
    { name: "Sem Guarda", description: "Todo ataque que inflingir status em outro Pokémon, recebe +1" },
    { name: "Inabalável", description: "Se este Pokémon estiver sobre qualquer status, sua agilidade é aumentada em +2" },
  ],
  machoke: [
    { name: "Coragem", description: "Se este Pokémon estiver sobre qualquer status, todos seus ataques recebem +2" },
    { name: "Sem Guarda", description: "Todo ataque que inflingir status em outro Pokémon, recebe +1" },
    { name: "Inabalável", description: "Se este Pokémon estiver sobre qualquer status, sua agilidade é aumentada em +2" },
  ],
  machamp: [
    { name: "Coragem", description: "Se este Pokémon estiver sobre qualquer status, todos seus ataques recebem +2" },
    { name: "Sem Guarda", description: "Todo ataque que inflingir status em outro Pokémon, recebe +1" },
    { name: "Inabalável", description: "Se este Pokémon estiver sobre qualquer status, sua agilidade é aumentada em +2" },
  ],
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
  victreebel: [
    { name: "Clorofila", description: "+2 de agilidade se dia ensolarado estiver ativo" },
    { name: "Gula", description: "Este Pokémon recebe +1 em todos seus ataques para cada estágio da linha evolutiva do Pokémon inimigo" },
    { name: "Domínio Tóxico", description: "Quando esse Pokémon inflingir Poison a um inimigo, o mesmo recebe dois Tokens de Poison (efeitos dobrados)" },
  ],
  tentacool: [
    { name: "Corpo Transparente", description: "Este Pokémon é imune a todo e qualquer tipo de redução de dano, defesa e agilidade" },
    { name: "Lodo Líquido", description: "+1 de ataque para os ataques de veneno e água" },
    { name: "Chuva Fina", description: "Se dança da chuva estiver ativa, todo ataque contra este Pokémon será em desvantagem" },
  ],
  tentacruel: [
    { name: "Corpo Transparente", description: "Este Pokémon é imune a todo e qualquer tipo de redução de dano, defesa e agilidade" },
    { name: "Lodo Líquido", description: "+1 de ataque para os ataques de veneno e água" },
    { name: "Chuva Fina", description: "Se dança da chuva estiver ativa, todo ataque contra este Pokémon será em desvantagem" },
  ],
  geodude: [
    { name: "Cabeça de Rocha", description: "Ataques com vantagem contra esse Pokémon recebem +1 ao invés de +2" },
    { name: "Robusto", description: "Para vencer esse Pokémon, o oponente precisa vencer duas vezes seguidas" },
    { name: "Véu de Areia", description: "Se tempestade de areia estiver ativa, +2 de agilidade" },
  ],
  graveler: [
    { name: "Cabeça de Rocha", description: "Ataques com vantagem contra esse Pokémon recebem +1 ao invés de +2" },
    { name: "Robusto", description: "Para vencer esse Pokémon, o oponente precisa vencer duas vezes seguidas" },
    { name: "Véu de Areia", description: "Se tempestade de areia estiver ativa, +2 de agilidade" },
  ],
  golem: [
    { name: "Cabeça de Rocha", description: "Ataques com vantagem contra esse Pokémon recebem +1 ao invés de +2" },
    { name: "Robusto", description: "Para vencer esse Pokémon, o oponente precisa vencer duas vezes seguidas" },
    { name: "Véu de Areia", description: "Se tempestade de areia estiver ativa, +2 de agilidade" },
  ],
  ponyta: [
    { name: "Run Away", description: "Ignora penalidades" },
    { name: "Chama", description: "+1 Fire" },
    { name: "Velocidade", description: "Reduz ataque inimigo" },
  ],
  rapidash: [
    { name: "Dia ensolarado", description: "Sumone um dia ensolarado até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Fuga", description: "O time com o Pokémon com essa habilidade, pode evitar qualquer batalha selvagem ao revelar o Pokémon encontrado" },
    { name: "Corpo em Chamas", description: "Ao iniciar uma batalha contra esse Pokémon, faça um teste normal para inflingir Burn no Pokémon inimigo" },
  ],
  slowpoke: [
    { name: "Ritmo Próprio", description: "Este Pokémon é imune a qualquer status proveniente de ataques" },
    { name: "Regenerador", description: "Ao ser derrotado, este Pokémon fica indisponível até o fim da batalha, mas ele nunca fica nocauteado" },
  ],
  slowbro: [
    { name: "Ritmo Próprio", description: "Este Pokémon é imune a qualquer status proveniente de ataques" },
    { name: "Regenerador", description: "Ao ser derrotado, este Pokémon fica indisponível até o fim da batalha, mas ele nunca fica nocauteado" },
  ],
  magnemite: [
    { name: "Atração Magnética", description: "Para cada Pokémon do tipo elétrico ou metálico da equipe inimiga ou da sua equipe (o Maior deve ser considerado), receba +1 de ataque para ataques elétricos" },
    { name: "Robusto", description: "Para vencer esse Pokémon, o oponente precisa vencer duas vezes seguidas" },
    { name: "Analítica", description: "Caso esse Pokémon tenha menos agilidade que o Pokémon inimigo, receba +2 de ataque para todos seus ataques" },
  ],
  magneton: [
    { name: "Atração Magnética", description: "Para cada Pokémon do tipo elétrico ou metálico da equipe inimiga ou da sua equipe (o Maior deve ser considerado), receba +1 de ataque para ataques elétricos" },
    { name: "Robusto", description: "Para vencer esse Pokémon, o oponente precisa vencer duas vezes seguidas" },
    { name: "Analítica", description: "Caso esse Pokémon tenha menos agilidade que o Pokémon inimigo, receba +2 de ataque para todos seus ataques" },
  ],
  "farfetchd": [
    { name: "Olhar Atento", description: "Nada pode diminuir o ataque desse Pokémon" },
    { name: "Foco Interno", description: "Este Pokémon é imune a status de confusão, sono e veneno" },
    { name: "Desafiador", description: "Se esse Pokémon estiver sobre qualquer status, seu ataque recebe +2 por status" },
  ],
  doduo: [
    { name: "Run Away", description: "Ignora penalidades" },
    { name: "Ataque Duplo", description: "+1 ataque" },
    { name: "Instinto", description: "Reduz ataque inimigo" },
  ],
  dodrio: [
    { name: "Fuga", description: "O time com o Pokémon com essa habilidade, pode evitar qualquer batalha selvagem ao revelar o Pokémon encontrado" },
    { name: "Madrugador", description: "Todo teste para inflingir status de sono contra o time com esse Pokémon tem desvantagem" },
    { name: "Pés Emaranhados", description: "Se esse Pokémon estiver sob qualquer status, recebe +2 de agilidade por status" },
  ],
  seel: [
    { name: "Dança da Chuva", description: "Sumone uma chuva até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Gordura Espessa", description: "Ataques de fogo e gelo contra esse Pokémon recebem -3 de dano" },
    { name: "Hidratação", description: "Se dança da chuva estiver ativa, este Pokémon fica imune a todos status" },
    { name: "Corpo de Gelo", description: "Se tempestade de granizo estiver ativa, este Pokémon só é vencido se perder duas vezes seguidas" },
  ],
  dewgong: [
    { name: "Gordura Espessa", description: "Ataques de fogo e gelo contra esse Pokémon recebem -3 de dano" },
    { name: "Hidratação", description: "Se dança da chuva estiver ativa, este Pokémon fica imune a todos status" },
    { name: "Corpo de Gelo", description: "Se tempestade de granizo estiver ativa, este Pokémon só é vencido se perder duas vezes seguidas" },
  ],
  grimer: [
    { name: "Mau Cheiro", description: "Trate todo ataque desse Pokémon como se tivesse o status de Poison" },
    { name: "Aperto Pegajoso", description: "Quando esse Pokémon inflingir Poison a um inimigo, o mesmo recebe dois Tokens de Poison (efeitos dobrados)" },
    { name: "Toque Venenoso", description: "Sempre que esse Pokémon entra em batalha ou sofre algum status, faça um teste normal para inflingir Veneno ao Pokémon inimigo" },
  ],
  muk: [
    { name: "Mau Cheiro", description: "Trate todo ataque desse Pokémon como se tivesse o status de Poison" },
    { name: "Aperto Pegajoso", description: "Quando esse Pokémon inflingir Poison a um inimigo, o mesmo recebe dois Tokens de Poison (efeitos dobrados)" },
    { name: "Toque Venenoso", description: "Sempre que esse Pokémon entra em batalha ou sofre algum status, faça um teste normal para inflingir Veneno ao Pokémon inimigo" },
  ],
  shellder: [
    { name: "Armadura de Casco", description: "+1 de defesa" },
    { name: "Vínculo de Habilidade", description: "+1 defesa" },
    { name: "Sobretudo", description: "+1 ataque" },
  ],
  cloyster: [
    { name: "Armadura de Casco", description: "+1 de defesa" },
    { name: "Espinhos", description: "Todo ataque contra esse Pokémon que tiver vantagem por seu tipo, perde o +2 pontos da vantagem" },
    { name: "Blindagem", description: "Todos modificadores de clima são ignorados por esse Pokémon enquanto estiver em batalha" },
  ],
  gastly: [
    { name: "Névoa", description: "Sumone uma névoa até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Levitate", description: "Este Pokémon se torna imune a ataques do tipo Terra" },
  ],
  haunter: [
    { name: "Névoa", description: "Sumone uma névoa até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Levitate", description: "Este Pokémon se torna imune a ataques do tipo Terra" },
  ],
  gengar: [
    { name: "Névoa", description: "Sumone uma névoa até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Levitate", description: "Este Pokémon se torna imune a ataques do tipo Terra" },
    { name: "Corpo Amaldiçoado", description: "Antes de iniciar a batalha contra esse Pokémon, escolha um ataque do Pokémon inimigo para ficar indisponível até que o Gengar seja derrotado" },
  ],
  onix: [
    { name: "Tempestade de Areia", description: "Sumone uma tempeste de areia até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Cabeça de Rocha", description: "Ataques com vantagem contra esse Pokémon recebem +1 ao invés de +2" },
    { name: "Robusto", description: "Para vencer esse Pokémon, o oponente precisa vencer duas vezes seguidas" },
    { name: "Armadura Frágil", description: "Todo ataque que não inflinge status contra esse Pokémon, recebe -2 de valor" },
  ],
  steelix: [
    { name: "Tempestade de Areia", description: "Sumone uma tempeste de areia até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Cabeça de Rocha", description: "Ataques com vantagem contra esse Pokémon recebem +1 ao invés de +2" },
    { name: "Robusto", description: "Para vencer esse Pokémon, o oponente precisa vencer duas vezes seguidas" },
    { name: "Armadura Frágil", description: "Todo ataque que não inflinge status contra esse Pokémon, recebe -2 de valor" },
    { name: "Força Pura", description: "Todo ataque que inflingir status desse Pokémon tem vantagem na rolagem" },
  ],
  drowzee: [
    { name: "Foco Interno", description: "Este Pokémon é imune a status de confusão, sono e veneno" },
    { name: "Insônia", description: "Este Pokémon é imune a status de sono" },
    { name: "Aviso Prévio", description: "Ao entrar na batalha, escolha um ataque do Pokémon inimigo para ficar indisponível até que este Pokémon seja derrotado" },
  ],
  hypno: [
    { name: "Foco Interno", description: "Este Pokémon é imune a status de confusão, sono e veneno" },
    { name: "Insônia", description: "Este Pokémon é imune a status de sono" },
    { name: "Aviso Prévio", description: "Ao entrar na batalha, escolha um ataque do Pokémon inimigo para ficar indisponível até que este Pokémon seja derrotado" },
  ],
  krabby: [
    { name: "Dança da Chuva", description: "Sumone uma chuva até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Hiper Cortador", description: "Escolha um ataque desse Pokémon para receber +2 pontos de ataque" },
    { name: "Armadura de Casco", description: "+1 de defesa" },
    { name: "Força Bruta", description: "Todo Ataque aprendido que inflinge qualquer status recebe +1 de ataque" },
  ],
  kingler: [
    { name: "Dança da Chuva", description: "Sumone uma chuva até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Hiper Cortador", description: "Escolha um ataque desse Pokémon para receber +2 pontos de ataque" },
    { name: "Armadura de Casco", description: "+1 de defesa" },
    { name: "Força Bruta", description: "Todo Ataque aprendido que inflinge qualquer status recebe +1 de ataque" },
  ],
  voltorb: [
    { name: "À prova de som", description: "Este Pokémon é imune aos status de confusão e sono" },
    { name: "Aura Estática", description: "Sempre que esse Pokémon entra em batalha ou sofre algum status, faça um teste normal para inflingir paralisia no Pokémon inimigo" },
    { name: "Auto Destruição", description: "Numa batalha, ao usar essa habilidade, seu próximo ataque receberá +3 de dano, porém esse Pokémon será nocauteado após a resolução" },
  ],
  electrode: [
    { name: "Tempestade", description: "Sumone uma Tempestade Elétrica até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "À prova de som", description: "Este Pokémon é imune aos status de confusão e sono" },
    { name: "Aura Estática", description: "Sempre que esse Pokémon entra em batalha ou sofre algum status, faça um teste normal para inflingir paralisia no Pokémon inimigo" },
    { name: "Auto Destruição", description: "Numa batalha, ao usar essa habilidade, seu próximo ataque receberá +3 de dano, porém esse Pokémon será nocauteado após a resolução" },
  ],
  exeggcute: [
    { name: "Clorofila", description: "+2 de agilidade se dia ensolarado estiver ativo" },
    { name: "Colheita", description: "Qualquer cura de status ou de Pokémon nocauteado pode ser extendida a outro Pokémon da equipe" },
  ],
  exeggutor: [
    { name: "Clorofila", description: "+2 de agilidade se dia ensolarado estiver ativo" },
    { name: "Colheita", description: "Qualquer cura de status ou de Pokémon nocauteado pode ser extendida a outro Pokémon da equipe" },
  ],
  cubone: [
    { name: "Tempestade de Areia", description: "Sumone uma tempeste de areia até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Cabeça de Rocha", description: "Ataques com vantagem contra esse Pokémon recebem +1 ao invés de +2" },
    { name: "Armadura de Batalha", description: "Rolagens críticas (1, 1) ou (5, 5) são ignoradas por esse Pokémon, e devem ser repetidas" },
  ],
  marowak: [
    { name: "Tempestade de Areia", description: "Sumone uma tempeste de areia até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Cabeça de Rocha", description: "Ataques com vantagem contra esse Pokémon recebem +1 ao invés de +2" },
    { name: "Para-raios", description: "Para cada ataque elétrico usado pela sua equipe ou pela inimiga, esse Pokémon recebe +1 de dano (válido para o próximo ataque deste Pokémon)" },
    { name: "Armadura de Batalha", description: "Rolagens críticas (1, 1) ou (5, 5) são ignoradas por esse Pokémon, e devem ser repetidas" },
  ],
  hitmonlee: [
    { name: "Flexível", description: "Este Pokémon é imune a paralisia" },
    { name: "Imprudente", description: "Ataques com vantagem contra esse Pokémon não recebem o bônus de +2" },
    { name: "Desonesto", description: "Vantagem por tipo recebem bonus de +3 ao invés de +2 para ataques desse Pokémon" },
  ],
  hitmonchan: [
    { name: "Olho Aguçado", description: "Este Pokémon é completamente imune a modificadores que reduzam seus ataques (status, habilidades inatas e habilidades do tipo) (vantagem por tipagem não é afetada)" },
    { name: "Punho de Ferro", description: "Todos ataques de punho deste Pokémon recebem +1 de ataque" },
    { name: "Foco Interno", description: "Este Pokémon é imune a status de confusão, sono e veneno" },
  ],
  lickitung: [
    { name: "Ritmo Próprio", description: "Este Pokémon é imune a qualquer status proveniente de ataques" },
    { name: "Núvem Nove", description: "Enquanto este Pokémon estiver saudável em uma equipe, nenhum efeito de clima deverá ser aplicado" },
    { name: "Alheio", description: "Todos status inflingidos a esse Pokémon, por ataque, tem desvantagem" },
  ],
  koffing: [
    { name: "Levitate", description: "Este Pokémon se torna imune a ataques do tipo Terra" },
  ],
  weezing: [
    { name: "Levitate", description: "Este Pokémon se torna imune a ataques do tipo Terra" },
    { name: "Auto Destruição", description: "Numa batalha, ao usar essa habilidade, seu próximo ataque receberá +3 de dano, porém esse Pokémon será nocauteado após a resolução" },
  ],
  rhyhorn: [
    { name: "Tempestade de Areia", description: "Sumone uma tempeste de areia até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Rock Head", description: "Ignora penalidade própria" },
    { name: "Força", description: "+1 ataque" },
    { name: "Casco", description: "+1 defesa" },
  ],
  rhydon: [
    { name: "Tempestade de Areia", description: "Sumone uma tempeste de areia até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Rock Head+", description: "Ignora penalidade própria" },
    { name: "Força Bruta", description: "+2 ataque" },
    { name: "Blindagem", description: "+2 defesa" },
  ],
  chansey: [
    { name: "Natural Cure", description: "Ignora status" },
    { name: "Proteção", description: "Reduz ataque inimigo" },
    { name: "Suporte", description: "Reduz penalidade no time" },
  ],
  tangela: [
    { name: "Regenerator", description: "Reduz penalidade recebida" },
    { name: "Enroscar", description: "Reduz ataque inimigo" },
    { name: "Crescimento", description: "+1 ataque" },
  ],
  kangaskhan: [
    { name: "Early Bird", description: "Ignora sleep" },
    { name: "Proteção Maternal", description: "+1 defesa" },
    { name: "Força", description: "+1 ataque" },
  ],
  horsea: [
    { name: "Swift Swim", description: "+1 ataque" },
    { name: "Precisão", description: "Ignora defesa parcial" },
    { name: "Fluxo", description: "Reduz ataque inimigo" },
  ],
  seadra: [
    { name: "Dança da Chuva", description: "Sumone uma chuva até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Swift Swim+", description: "+1 ataque" },
    { name: "Pressão", description: "Reduz defesa inimiga" },
    { name: "Veneno", description: "Poison forte" },
  ],
  goldeen: [
    { name: "Swift Swim", description: "+1 ataque" },
    { name: "Resistência", description: "+1 defesa" },
    { name: "Fluxo", description: "Reduz ataque inimigo" },
  ],
  seaking: [
    { name: "Dança da Chuva", description: "Sumone uma chuva até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Swift Swim+", description: "+1 ataque" },
    { name: "Força", description: "+1 ataque" },
    { name: "Pressão", description: "Reduz defesa inimiga" },
  ],
  staryu: [
    { name: "Natural Cure", description: "Ignora status" },
    { name: "Regeneração", description: "Reduz penalidade" },
    { name: "Agilidade", description: "+1 ataque" },
  ],
  starmie: [
    { name: "Natural Cure+", description: "Ignora status" },
    { name: "Pressão Psíquica", description: "Reduz ataque inimigo" },
    { name: "Velocidade", description: "+1 ataque" },
  ],
  "mr-mime": [
    { name: "Filter", description: "Reduz penalidade recebida" },
    { name: "Barreira", description: "+2 defesa" },
    { name: "Confusão", description: "Reduz valor inimigo" },
  ],
  scyther: [
    { name: "Technician", description: "+1 ataque" },
    { name: "Velocidade", description: "Reduz ataque inimigo" },
    { name: "Precisão", description: "Ignora defesa parcial" },
  ],
  jynx: [
    { name: "Tempestade de Granizo", description: "Sumone uma tempeste de granizo até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Oblivious", description: "Ignora status" },
    { name: "Beijo Gelado", description: "Reduz valor inimigo" },
    { name: "Pressão", description: "Reduz ataque inimigo" },
  ],
  electabuzz: [
    { name: "Static", description: "Empate causa paralisia" },
    { name: "Sobrecarga", description: "+1 ataque Electric" },
    { name: "Velocidade", description: "Reduz ataque inimigo" },
  ],
  magmar: [
    { name: "Dia ensolarado", description: "Sumone um dia ensolarado até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Flame Body", description: "Quem perde recebe burn" },
    { name: "Chamas", description: "+1 Fire" },
    { name: "Pressão", description: "Reduz defesa inimiga" },
  ],
  pinsir: [
    { name: "Hyper Cutter", description: "Impede redução de ataque" },
    { name: "Pinça", description: "+1 ataque" },
    { name: "Força", description: "Reduz defesa inimiga" },
  ],
  tauros: [
    { name: "Intimidate", description: "-1 ataque inimigo" },
    { name: "Fúria", description: "+1 ataque" },
    { name: "Força Bruta", description: "Ignora defesa parcial" },
  ],
  magikarp: [
    { name: "Swift Swim", description: "+1 ataque" },
    { name: "Persistência", description: "Empate favorece" },
    { name: "Potencial", description: "Bônus leve variável" },
  ],
  gyarados: [
    { name: "Intimidate", description: "-1 ataque inimigo" },
    { name: "Fúria", description: "+2 ataque" },
    { name: "Presença", description: "Reduz ataque inimigo" },
  ],
  lapras: [
    { name: "Tempestade de Granizo", description: "Sumone uma tempeste de granizo até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Water Absorb", description: "Ignora penalidades Water" },
    { name: "Casco", description: "+2 defesa" },
    { name: "Congelamento", description: "Reduz valor inimigo" },
  ],
  ditto: [
    { name: "Impostor", description: "Copia bônus do oponente" },
    { name: "Adaptação", description: "Bônus leve variável" },
    { name: "Flexibilidade", description: "Ignora penalidades leves" },
  ],
  eevee: [
    { name: "Adaptability", description: "+1 ataque" },
    { name: "Instinto", description: "Empate favorece" },
    { name: "Versatilidade", description: "Bônus leve variável" },
  ],
  vaporeon: [
    { name: "Dança da Chuva", description: "Sumone uma chuva até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Water Absorb", description: "Ignora penalidades Water" },
    { name: "Fluxo", description: "+1 ataque Water" },
    { name: "Resistência", description: "+1 defesa" },
  ],
  jolteon: [
    { name: "Volt Absorb", description: "Ignora penalidades Electric" },
    { name: "Descarga", description: "+1 ataque Electric" },
    { name: "Velocidade", description: "Reduz ataque inimigo" },
  ],
  flareon: [
    { name: "Flash Fire", description: "Ignora efeitos Fire" },
    { name: "Chamas", description: "+1 Fire" },
    { name: "Resistência", description: "+1 defesa" },
  ],
  porygon: [
    { name: "Trace", description: "Copia habilidade do oponente" },
    { name: "Análise", description: "+1 ataque" },
    { name: "Adaptação", description: "Bônus leve variável" },
  ],
  omanyte: [
    { name: "Shell Armor", description: "Ignora bônus ofensivo forte" },
    { name: "Casco", description: "+1 defesa" },
    { name: "Fluxo", description: "+1 ataque" },
  ],
  omastar: [
    { name: "Shell Armor+", description: "Ignora bônus ofensivo forte" },
    { name: "Blindagem", description: "+2 defesa" },
    { name: "Pressão", description: "Reduz ataque inimigo" },
  ],
  kabuto: [
    { name: "Swift Swim", description: "+1 ataque" },
    { name: "Casco", description: "+1 defesa" },
    { name: "Força", description: "+1 ataque" },
  ],
  kabutops: [
    { name: "Swift Swim+", description: "+1 ataque" },
    { name: "Lâminas", description: "+2 ataque" },
    { name: "Pressão", description: "Reduz defesa inimiga" },
  ],
  aerodactyl: [
    { name: "Tempestade de Areia", description: "Sumone uma tempeste de areia até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Rock Head", description: "Ignora penalidade própria" },
    { name: "Pressão", description: "Reduz ataque inimigo" },
    { name: "Velocidade", description: "+1 ataque" },
  ],
  snorlax: [
    { name: "Thick Fat", description: "Reduz penalidade geral" },
    { name: "Corpo Pesado", description: "+2 defesa" },
    { name: "Preguiça", description: "Reduz ataque inimigo" },
  ],
  articuno: [
    { name: "Tempestade de Granizo", description: "Sumone uma tempeste de granizo até o fim da batalha, ou até que ela seja desfeita por outro efeito de clima" },
    { name: "Pressure", description: "Reduz ataque inimigo" },
    { name: "Frio Absoluto", description: "+2 Ice" },
    { name: "Presença Divina", description: "Empate favorece" },
  ],
  zapdos: [
    { name: "Pressure", description: "Reduz ataque inimigo" },
    { name: "Tempestade", description: "+2 Electric" },
    { name: "Presença Divina", description: "Empate favorece" },
  ],
  moltres: [
    { name: "Pressure", description: "Reduz ataque inimigo" },
    { name: "Chamas Sagradas", description: "+2 Fire" },
    { name: "Presença Divina", description: "Empate favorece" },
  ],
  dratini: [
    { name: "Shed Skin", description: "Ignora status" },
    { name: "Força", description: "+1 ataque" },
    { name: "Resistência", description: "+1 defesa" },
  ],
  dragonair: [
    { name: "Shed Skin+", description: "Ignora status" },
    { name: "Força Dracônica", description: "+1 ataque" },
    { name: "Presença", description: "Reduz ataque inimigo" },
  ],
  dragonite: [
    { name: "Shed Skin", description: "Ignora status" },
    { name: "Força Colossal", description: "+2 ataque" },
    { name: "Presença Dominante", description: "Reduz ataque inimigo" },
  ],
  mewtwo: [
    { name: "Pressure", description: "Reduz ataque inimigo" },
    { name: "Poder Absoluto", description: "+2 geral" },
    { name: "Domínio Mental", description: "Ignora defesa" },
  ],
  mew: [
    { name: "Synchronize", description: "Reflete status" },
    { name: "Versatilidade", description: "+1 geral" },
    { name: "Adaptação Total", description: "Bônus variável" },
  ],
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