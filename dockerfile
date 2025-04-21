# Usa versão específica do Node.js 21 com imagem leve
FROM node:21.7.3-slim

# Atualiza pacotes base e limpa cache para imagem mais segura
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*

# Define diretório de trabalho no container
WORKDIR /app

# Copia os arquivos de dependência primeiro para otimizar cache
COPY package*.json ./

# Instala dependências sem as dev-deps (para produção)
RUN npm install --omit=dev

# Copia o restante do projeto
COPY . .

# Expõe a porta padrão usada pela API
EXPOSE 3000

# Comando padrão para iniciar a aplicação
CMD ["npm", "start"]
