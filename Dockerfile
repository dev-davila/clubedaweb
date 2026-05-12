FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Sao_Paulo

RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    git \
    openssl \
    libssl-dev \
    build-essential \
    python3 \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Node 20 (alguns deps como @aws-sdk/client-s3 exigem >= 20)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Yarn classic
RUN npm install -g yarn@1.22.22

# Espelha a estrutura de diretório da Abacus para que o prisma/schema.prisma
# funcione sem alterações (output hardcoded em /home/ubuntu/m3solutions_site/...)
RUN useradd -m -s /bin/bash ubuntu \
    && mkdir -p /home/ubuntu/m3solutions_site/nextjs_space \
    && chown -R ubuntu:ubuntu /home/ubuntu

WORKDIR /home/ubuntu/m3solutions_site/nextjs_space

# Copia manifestos primeiro para aproveitar cache
COPY --chown=ubuntu:ubuntu package.json ./
COPY --chown=ubuntu:ubuntu prisma ./prisma

USER ubuntu

# legacy-peer-deps via .npmrc evita falhas de peer dependency em libs antigas
RUN echo "legacy-peer-deps=true" > .npmrc

# Instala com yarn (lockfile é regenerado dentro do container; o yarn.lock do
# host é um symlink quebrado pra um path interno da Abacus)
RUN yarn install --network-timeout 600000 --ignore-engines

COPY --chown=ubuntu:ubuntu . .

# Remove o symlink quebrado caso tenha vindo do COPY
RUN rm -f yarn.lock && yarn install --network-timeout 600000 --ignore-engines

RUN yarn prisma generate

EXPOSE 3000

CMD ["yarn", "dev"]
