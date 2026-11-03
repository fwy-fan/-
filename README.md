# AI 美甲工作室 · AI Nail Studio

顾客上传手部照片后，AI 会分析：

- 肤色：深浅按 Monk 10 级肤色量表判断，并区分冷暖调
- 甲床和手指形状

再结合顾客自己选的风格方向（女性化 / 男士美甲 / 中性）、地区审美、场合和长度，推荐 4 款美甲设计，并把设计直接画在顾客自己的手上，生成效果图。顾客也可以用任何语言描述想要的效果，直接生成。网站按点数收费，用 Stripe 收款。

## 功能

- **AI 手部分析与推荐**（1 点）：用 Claude 分析照片，返回：
  - 肤色深浅、冷暖调、甲床、指形和指甲状况
  - 4 款不同方向的推荐，每款附配色色值、适合的原因、甲型、质感和维护难度
- **效果图生成**（2 点/张）：可以直接生成推荐款，也可以按顾客自己的描述生成。按描述生成时，Claude 先把描述变成精确的设计，再交给图像模型，在原照片上只改指甲。
- **包容性设计**：
  - 配色建议只看照片里能看到的肤色深浅和冷暖调，**不推测种族或民族**；顾客可以手动校正肤色。
  - 男士美甲有一套单独的设计规则（干净的短甲、哑光护甲、深色纯色、极简线条等）。
  - 内置 18 个国家/地区的流行趋势：中国、港澳台、日本、韩国、东南亚、印度、中东、美国、加拿大、拉美、英国、法国、欧洲其他国家、俄罗斯、西非、东非、南非、澳新。地区由顾客自己选，不根据外貌推断。
- **中英双语界面**：自动识别浏览器语言，也可以手动切换。
- **Stripe 收费**：
  - 卖点数包（10 / 30 / 100 点），通过 Stripe Checkout 付款。
  - Webhook 验证签名后才加点数，同一笔付款只会入账一次。
  - AI 调用失败或照片不合格时，自动退还点数。
- **隐私**：原始手部照片只在本次请求中使用，不会保存；上传时会去掉照片的 EXIF 信息（包括 GPS 位置）。

## 技术栈

Next.js 16（App Router）· TypeScript · Tailwind CSS 4 · PostgreSQL + Drizzle ORM · Claude API（`@anthropic-ai/sdk`）· OpenAI 图像编辑模型 · Stripe

| 文件 | 作用 |
| --- | --- |
| `src/lib/ai/claude.ts` | Claude 手部分析、推荐、把描述变成设计 |
| `src/lib/ai/image-model.ts` | 调用图像模型生成效果图（要换供应商只需改这个文件） |
| `src/lib/styles.ts` | 风格方向、地区审美、Monk 肤色量表 |
| `src/lib/pricing.ts` | 点数包价格（调价直接改这里） |
| `src/lib/credits.ts` | 每次操作消耗的点数，以及扣点、退点、入账 |
| `src/app/api/checkout` | 创建 Stripe Checkout |
| `src/app/api/webhooks/stripe` | Stripe Webhook，付款成功后加点数 |
| `src/lib/i18n.ts` | 中英文文案 |

## 本地运行

```bash
npm install
cp .env.example .env.local   # 填入各项密钥
npm run db:migrate           # 在数据库中建表
npm run dev
```

本地测试 Stripe 付款需要先安装 [Stripe CLI](https://docs.stripe.com/stripe-cli)，然后运行：

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

把命令输出的 `whsec_...` 填进 `STRIPE_WEBHOOK_SECRET`，再用测试卡 `4242 4242 4242 4242` 付款。

## 上线收费步骤

1. **数据库**：在 [Neon](https://neon.tech) 或 Supabase 创建一个 Postgres 数据库，拿到 `DATABASE_URL`，然后运行 `npm run db:migrate`。
2. **部署**：
   - 推荐用 [Vercel](https://vercel.com)。导入本仓库，在 Environment Variables 里填入 `.env.example` 中的全部变量，`NEXT_PUBLIC_APP_URL` 填正式域名。
   - 生成一张图可能需要 30–90 秒，`/api/generate` 设置了 `maxDuration = 300`。Vercel 要 Pro 套餐，单次请求才能超过 60 秒。
3. **Stripe**：
   1. 完成 Stripe 账户激活（填写企业或个人信息，以及收款银行账户），否则只能用测试模式。注意 Stripe 支持的国家和地区有限：比如中国大陆主体目前不能直接开户，可以考虑用香港、新加坡或美国公司，或者 Stripe Atlas。
   2. 在 Dashboard → Developers → API keys 复制 **live** 密钥 `sk_live_...`，填入 `STRIPE_SECRET_KEY`。
   3. 在 Dashboard → Developers → Webhooks 添加端点 `https://你的域名/api/webhooks/stripe`，订阅 `checkout.session.completed` 和 `checkout.session.async_payment_succeeded` 两个事件，把签名密钥填入 `STRIPE_WEBHOOK_SECRET`。
   4. 在 Dashboard → Settings → Payment methods 打开需要的支付方式，比如银行卡、Apple Pay、Google Pay、支付宝、微信支付。
4. **API 密钥**：在 Anthropic Console 和 OpenAI 平台分别创建密钥并充值。

## 成本与定价参考

- 每次 AI 分析大约花几美分（Claude）。
- 每张效果图约 $0.05–0.25，具体取决于 `OPENAI_IMAGE_QUALITY`。
- 默认售价约 $0.30–0.50/点：分析 1 点，效果图 2 点，留有利润空间。

上线前请按实际账单调整 `src/lib/pricing.ts` 和 `src/lib/credits.ts`。

## 后续可以做

- 把生成的图片从数据库转存到对象存储（S3 / R2），减轻数据库负担。
- 登录增加邮箱验证和找回密码，或者接入 Google / Apple 登录。
- 给接口加限流，防止滥用。
- 增加更多界面语言（西班牙语、法语、阿拉伯语等）。
