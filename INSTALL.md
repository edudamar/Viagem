# Como gerar o APK do app

## Opção 1: PWA Installer (Mais fácil)

O app já é uma PWA e pode ser instalado direto no navegador:

1. Abra `http://10.1.1.14:5173` no Chrome do celular
2. Toque nos 3 pontos (⋮) → **"Adicionar à tela inicial"**
3. O ícone aparece como um app nativo

## Opção 2: APK via PWABuilder (Para instalar sem navegador)

### Passo 1: Hospedar o app gratuitamente

```bash
# No PC, instale o Vercel CLI
npm install -g vercel

# Na pasta do projeto, faça deploy
cd travel-app
vercel --prod
```

Ou use o GitHub Pages:
1. Crie um repositório no GitHub
2. Faça push do código
3. Ative GitHub Pages nas configurações

### Passo 2: Gerar o APK

1. Acesse [pwabuilder.com](https://www.pwabuilder.com)
2. Cole a URL do app (ex: `https://seu-app.vercel.app`)
3. Clique em **"Package for stores"**
4. Escolha **"Android"**
5. Baixe o APK

### Passo 3: Instalar no celular

1. Transfira o APK para o celular (WhatsApp, email, etc.)
2. Abra o arquivo APK
3. Ative **"Fontes desconhecidas"** se solicitado
4. Instale

## Opção 3: Usar o app sem instalar

O app funciona perfeitamente pelo navegador:
- Acesse `http://10.1.1.14:5173`
- Adicione aos favoritos
- Funciona offline após a primeira visita
