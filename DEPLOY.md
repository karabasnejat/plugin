# Deploy

Bu MCP sunucusu HTTP endpoint olarak deploy edilir. ChatGPT MCP bağlantısı için public HTTPS URL gerekir.

## Render ile deploy

1. Bu klasörü GitHub reposuna gönder.
2. Render'da **New Web Service** seç.
3. Repoyu bağla.
4. Ayarlar:
   - Build command: `npm ci && npm run build`
   - Start command: `npm start`
   - Health check path: `/health`
5. Deploy bittikten sonra MCP URL:

```text
https://RENDER-SERVICE-ADIN.onrender.com/mcp
```

## Docker ile deploy

```bash
docker build -t akbank-credit-offers-mcp .
docker run --rm -p 3000:3000 akbank-credit-offers-mcp
```

MCP URL:

```text
http://localhost:3000/mcp
```

## ChatGPT'ye bağlama

ChatGPT eklenti/MCP ekranında bağlantı tipi olarak sunucu URL'si kullanacaksan şu adresi gir:

```text
https://DEPLOY-URL/mcp
```

Açıklama alanı için [plugin-aciklama.md](plugin-aciklama.md) içindeki "Form için önerilen açıklama" metnini kullan.

Kimlik doğrulama zorunlu değilse **No authentication** seç. Arayüz sadece OAuth kabul ediyorsa, bu sunucuya ayrıca OAuth katmanı eklenmelidir.