# 💰 Custos da API Gemini - Nardotos Finance

## 📊 Limites do Tier Gratuito (Gemini 2.5 Flash)

### Por Minuto
- ✅ **15 requisições/minuto (RPM)**
- ✅ **1 milhão tokens/minuto (TPM)**

### Por Dia
- ✅ **1.500 requisições/dia (RPD)**
- ✅ **Ilimitado em tokens diários**

## 💸 Custo Estimado por Operação

### Entrada de Texto (Grátis dentro dos limites)
- 📝 Lançamento simples: ~500 tokens
- 📝 Múltiplos lançamentos: ~1.000 tokens
- 📅 Planejamento: ~800 tokens

**Exemplo:** "Gastei 45 no mercado" = **~500 tokens**

### Processamento de Imagem (ALTO CUSTO!)
- 📸 Foto de extrato: **5.000-10.000+ tokens**
- 📸 Extrato longo: **15.000+ tokens**

**Exemplo:** 1 foto de extrato = **~10.000 tokens** (equivale a 20 entradas de texto!)

## 🎯 Como Ficar 100% Gratuito

### ✅ Use APENAS texto
- Digite manualmente: "Recebi 2000 salário"
- Digite lista: "Gastei 45 mercado, 20 uber, 100 farmacia"

### ⚠️ EVITE fotos de extrato
- **1 foto = 20 entradas de texto em custo**
- Use só em casos especiais

### 📈 Seu uso atual (28 dias)
- 18 requisições de 10.000 gratuitas/dia (0,18%)
- 1.36K tokens de 1M gratuitos/minuto (0,13%)
- **Status: BEM DENTRO do limite gratuito**

## 💡 Por que teve custo de R$0,14?

Provavelmente você:
1. Enviou 1-2 fotos de extrato bancário
2. Cada foto = ~10.000 tokens
3. Como ultrapassou algum limite ou está em tier pago, gerou custo

## 🔧 Configuração no Vercel (Opcional)

Você pode desabilitar completamente o upload de imagens via variáveis de ambiente:

### Como Configurar no Vercel:

1. Acesse seu projeto no Vercel: https://vercel.com/dashboard
2. Vá em **Settings** → **Environment Variables**
3. Adicione estas variáveis:

| Nome | Valor | Efeito |
|------|-------|--------|
| `MODO_ECONOMICO` | `true` | Ativa modo econômico |
| `PERMITIR_IMAGENS` | `false` | Bloqueia upload de fotos |

4. Clique em **Save** e faça **Redeploy** do projeto

### ✅ Proteção Ativa Agora:

Mesmo sem configurar no Vercel, o app JÁ tem proteção:
- ⚠️ Aviso antes de enviar foto (confirma se quer continuar)
- 💡 Dica visual para usar CSV ao invés de foto
- ✅ Suporte a CSV (custo de texto!)

## 📱 Alternativas ao Extrato (100% GRÁTIS!)

### ✅ Melhor Opção: CSV do Banco
1. Acesse seu banco (Nubank, Inter, Itaú, etc.)
2. Exporte extrato como **CSV** ou **Excel**
3. Faça upload do arquivo CSV no app
4. **Custo: Igual a texto (~500 tokens)** ✅

### ✅ Opção 2: Digite Manualmente
```
paguei 1500 aluguel, 150 luz, 80 internet, 50 celular dia 5
```

### ✅ Opção 3: Planejamento
```
pagar 1500 aluguel dia 30, 150 luz dia 10, 80 internet dia 15
```

### ❌ EVITE: Foto de Extrato
- **Custo: 10.000+ tokens (20x mais caro!)** ❌

## 🎓 Resumo

| Operação | Tokens | Custo no Free Tier | Recomendação |
|----------|--------|-------------------|--------------|
| Texto simples | 500 | ✅ Grátis | ✅ Use sempre |
| **CSV do banco** | **~500** | ✅ **Grátis** | ✅ **MELHOR OPÇÃO!** |
| Texto longo | 1.000 | ✅ Grátis | ✅ Use sempre |
| **Foto extrato** | **10.000+** | ⚠️ **Pode custar** | ❌ **EVITE** |

**Recomendação:** Use CSV do banco ou texto para ficar 100% gratuito! 🎉
