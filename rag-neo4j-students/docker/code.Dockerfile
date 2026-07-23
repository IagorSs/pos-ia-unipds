FROM node:24

# Atualiza dependências
RUN apt-get update && apt-get upgrade -y

RUN rm -rf /var/lib/apt/lists/*

# Updates npm version
RUN npm install -g npm@latest

# Comando padrão (mantém o container em execução para desenvolvimento)
CMD ["sleep", "infinity"]
