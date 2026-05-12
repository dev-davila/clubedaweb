// Lista completa de cidades brasileiras por estado (principais cidades por estado)
export const BRAZILIAN_CITIES: Record<string, string[]> = {
  'AC': ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó'],
  'AL': ['Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'União dos Palmares', 'Penedo', 'São Miguel dos Campos', 'Delmiro Gouveia', 'Coruripe', 'Santana do Ipanema'],
  'AP': ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Mazagão'],
  'AM': ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari', 'Tefé', 'Tabatinga', 'Maués', 'Humaitá', 'Iranduba'],
  'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro', 'Itabuna', 'Lauro de Freitas', 'Ilhéus', 'Jequié', 'Teixeira de Freitas', 'Barreiras', 'Alagoinhas', 'Porto Seguro', 'Simões Filho', 'Paulo Afonso', 'Eunápolis'],
  'CE': ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá', 'Pacatuba', 'Aquiraz', 'Canindé', 'Crateús'],
  'DF': ['Brasília', 'Ceilândia', 'Taguatinga', 'Samambaia', 'Plano Piloto', 'Águas Claras', 'Gama', 'Sobradinho', 'Planaltina', 'Guará', 'Recanto das Emas'],
  'ES': ['Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Linhares', 'Cachoeiro de Itapemirim', 'Colatina', 'Guarapari', 'São Mateus', 'Aracruz', 'Viana'],
  'GO': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia', 'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Novo Gama', 'Senador Canedo', 'Itumbiara', 'Catalão', 'Jataí'],
  'MA': ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias', 'Codó', 'Paço do Lumiar', 'Açailândia', 'Bacabal', 'Balsas', 'Santa Inês', 'Barra do Corda'],
  'MT': ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra', 'Cáceres', 'Sorriso', 'Lucas do Rio Verde', 'Primavera do Leste', 'Barra do Garças'],
  'MS': ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã', 'Naviraí', 'Nova Andradina', 'Aquidauana', 'Paranaíba', 'Sidrolândia'],
  'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga', 'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Ibirité', 'Poços de Caldas', 'Patos de Minas', 'Pouso Alegre', 'Barbacena', 'Teófilo Otoni', 'Varginha', 'Sabará', 'Conselheiro Lafaiete', 'Nova Lima', 'Araguari', 'Itabira', 'Passos', 'Lavras', 'Muriaé', 'Ituiutaba', 'Araxá'],
  'PA': ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas', 'Castanhal', 'Abaetetuba', 'Cametá', 'Marituba', 'Bragança', 'Altamira', 'Tucuruí', 'Barcarena', 'Itaituba'],
  'PB': ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa', 'Cajazeiras', 'Cabedelo', 'Guarabira', 'Sapé', 'Mamanguape'],
  'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá', 'Araucária', 'Toledo', 'Apucarana', 'Pinhais', 'Campo Largo', 'Almirante Tamandaré', 'Umuarama', 'Paranavaí', 'Piraquara', 'Cambé', 'Sarandi', 'Francisco Beltrão', 'Fazenda Rio Grande', 'Campo Mourão', 'Arapongas', 'Pato Branco'],
  'PE': ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns', 'Vitória de Santo Antão', 'Igarassu', 'São Lourenço da Mata', 'Abreu e Lima', 'Serra Talhada', 'Carpina', 'Araripina', 'Gravatá', 'Goiana'],
  'PI': ['Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano', 'Campo Maior', 'Barras', 'União', 'Altos', 'Pedro II'],
  'RJ': ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Belford Roxo', 'São João de Meriti', 'Campos dos Goytacazes', 'Petrópolis', 'Volta Redonda', 'Magé', 'Itaboraí', 'Macaé', 'Mesquita', 'Nova Friburgo', 'Barra Mansa', 'Angra dos Reis', 'Cabo Frio', 'Teresópolis', 'Nilópolis', 'São Pedro da Aldeia', 'Maricá', 'Queimados', 'Resende', 'Itaguaí', 'Rio das Ostras', 'Japeri', 'Itaperuna', 'Araruama', 'Três Rios'],
  'RN': ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba', 'Ceará-Mirim', 'Caicó', 'Açu', 'Currais Novos', 'São José de Mipibu'],
  'RS': ['Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria', 'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande', 'Alvorada', 'Passo Fundo', 'Sapucaia do Sul', 'Uruguaiana', 'Santa Cruz do Sul', 'Cachoeirinha', 'Bagé', 'Bento Gonçalves', 'Erechim', 'Guaíba', 'Santana do Livramento', 'Esteio', 'Ijuí', 'Alegrete', 'Santo Ângelo', 'Lajeado', 'Cruz Alta', 'Vacaria', 'Sapiranga', 'Farroupilha'],
  'RO': ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal', 'Jaru', 'Rolim de Moura', 'Guajará-Mirim', 'Ouro Preto do Oeste'],
  'RR': ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Alto Alegre', 'Mucajaí'],
  'SC': ['Joinville', 'Florianópolis', 'Blumenau', 'São José', 'Chapecó', 'Itajaí', 'Criciúma', 'Jaraguá do Sul', 'Palhoça', 'Lages', 'Balneário Camboriú', 'Brusque', 'Tubarão', 'São Bento do Sul', 'Caçador', 'Concórdia', 'Camboriú', 'Navegantes', 'Rio do Sul', 'Araranguá', 'Gaspar', 'Biguaçu', 'Indaial'],
  'SP': ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Ribeirão Preto', 'Osasco', 'Sorocaba', 'Mauá', 'São José dos Campos', 'Mogi das Cruzes', 'Santos', 'Diadema', 'Jundiaí', 'Piracicaba', 'Carapicuíba', 'Bauru', 'São José do Rio Preto', 'Itaquaquecetuba', 'Franca', 'Suzano', 'Taubaté', 'Praia Grande', 'São Vicente', 'Limeira', 'Barueri', 'Marília', 'Americana', 'Presidente Prudente', 'Taboão da Serra', 'Cotia', 'Sumaré', 'Embu das Artes', 'Indaiatuba', 'Araraquara', 'Jacareí', 'Hortolândia', 'Rio Claro', 'Itapevi', 'São Carlos', 'Santa Bárbara d\'Oeste', 'Itanhaém', 'Guarujá', 'Pindamonhangaba', 'Ferraz de Vasconcelos', 'Santana de Parnaíba', 'Araçatuba', 'Cubatão', 'Bragança Paulista', 'Sertãozinho', 'Atibaia', 'Catanduva', 'Botucatu', 'Valinhos', 'Itu', 'Itatiba', 'Várzea Paulista', 'Ourinhos', 'Assis', 'Votuporanga', 'Leme', 'Ibiúna', 'Jaú', 'Bebedouro', 'Jaguariúna', 'Mococa', 'Amparo', 'Araras', 'Vinhedo', 'São Caetano do Sul', 'Itapecerica da Serra', 'Franco da Rocha', 'Francisco Morato', 'Cajamar', 'Paulínia', 'Cosmópolis', 'Nova Odessa', 'Artur Nogueira', 'Pedreira', 'Holambra', 'Votorantim', 'Salto', 'Mairinque', 'Poá', 'Birigui', 'Lins', 'Peruíbe', 'Caraguatatuba', 'Ubatuba', 'São Sebastião', 'Ilhabela'],
  'SE': ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão', 'Estância', 'Tobias Barreto', 'Itabaianinha', 'Simão Dias', 'Propriá'],
  'TO': ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins', 'Colinas do Tocantins', 'Guaraí', 'Dianópolis', 'Tocantinópolis', 'Miracema do Tocantins']
};

export const BRAZILIAN_STATES = [
  { uf: 'AC', name: 'Acre' }, { uf: 'AL', name: 'Alagoas' }, { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' }, { uf: 'BA', name: 'Bahia' }, { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' }, { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' }, { uf: 'MA', name: 'Maranhão' }, { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' }, { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' }, { uf: 'PB', name: 'Paraíba' }, { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' }, { uf: 'PI', name: 'Piauí' }, { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' }, { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' }, { uf: 'RR', name: 'Roraima' }, { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' }, { uf: 'SE', name: 'Sergipe' }, { uf: 'TO', name: 'Tocantins' }
];

// Função para normalizar strings (remover acentos)
export function normalizeString(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Função para obter cidades de múltiplos estados
export function getCitiesForStates(states: string[]): { state: string; city: string }[] {
  const cities: { state: string; city: string }[] = [];
  for (const state of states) {
    const stateCities = BRAZILIAN_CITIES[state] || [];
    for (const city of stateCities) {
      cities.push({ state, city });
    }
  }
  return cities;
}

// Keywords sugeridas baseadas no serviço
export function generateSeoKeywords(serviceType: string, brand?: string): { main: string; secondary: string[] } {
  const normalizedService = serviceType.toLowerCase();
  
  const keywordMap: Record<string, { main: string; secondary: string[] }> = {
    'antivírus': { main: 'antivírus corporativo', secondary: ['proteção endpoint', 'segurança empresarial', 'antimalware', 'proteção contra ransomware'] },
    'antivirus': { main: 'antivírus corporativo', secondary: ['proteção endpoint', 'segurança empresarial', 'antimalware', 'proteção contra ransomware'] },
    'gestão de ti': { main: 'gestão de TI terceirizada', secondary: ['outsourcing TI', 'suporte técnico', 'infraestrutura de TI', 'TI gerenciada'] },
    'suporte técnico': { main: 'suporte técnico empresarial', secondary: ['help desk', 'service desk', 'atendimento TI', 'manutenção de TI'] },
    'cloud': { main: 'cloud computing empresarial', secondary: ['computação em nuvem', 'migração para nuvem', 'infraestrutura cloud', 'serviços cloud'] },
    'backup': { main: 'backup corporativo', secondary: ['backup em nuvem', 'disaster recovery', 'recuperação de dados', 'proteção de dados'] },
    'segurança': { main: 'segurança da informação', secondary: ['cibersegurança', 'proteção de dados', 'firewall', 'endpoint security'] },
    'firewall': { main: 'firewall corporativo', secondary: ['proteção de rede', 'segurança perimetral', 'UTM', 'next-gen firewall'] },
    'rede': { main: 'infraestrutura de rede', secondary: ['cabeamento estruturado', 'wifi corporativo', 'switches', 'roteadores'] },
    'servidor': { main: 'servidores corporativos', secondary: ['virtualização', 'data center', 'infraestrutura TI', 'storage'] },
    'microsoft 365': { main: 'Microsoft 365 empresarial', secondary: ['Office 365', 'Teams', 'SharePoint', 'Exchange Online'] },
    'licenciamento': { main: 'licenciamento de software', secondary: ['licenças Microsoft', 'software empresarial', 'gestão de licenças'] },
    'consultoria': { main: 'consultoria em TI', secondary: ['projetos de TI', 'transformação digital', 'estratégia tecnológica'] },
    'locação': { main: 'locação de equipamentos TI', secondary: ['aluguel de computadores', 'outsourcing de hardware', 'leasing TI'] },
  };
  
  // Procura match parcial
  for (const [key, value] of Object.entries(keywordMap)) {
    if (normalizedService.includes(key)) {
      const result = { ...value };
      if (brand) {
        result.secondary = [brand.toLowerCase(), ...result.secondary];
      }
      return result;
    }
  }
  
  // Default se não encontrar
  return {
    main: serviceType.toLowerCase(),
    secondary: brand ? [brand.toLowerCase(), 'empresas', 'corporativo', 'profissional'] : ['empresas', 'corporativo', 'profissional', 'serviços de TI']
  };
}
