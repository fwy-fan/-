# AI 美甲工作室 · AI Nail Studio

顾客上传手部照片后，AI 会分析：

- 肤色：深浅按 Monk 10 级肤色量表判断，并区分冷暖调
- 甲床和手指形状

再结合顾客自己选的风格方向（女性化 / 男士美甲 / 中性）、地区审美、场合和长度，推荐 4 款美甲设计，并把设计直接画在顾客自己的手上，生成效果图。顾客也可以用任何语言描述想要的效果，直接生成。网站按点数收费，用 [Creem](https://www.creem.io) 收款，个人也能开通。

## 功能

- **AI 手部分析与推荐**（1 点）：用 OpenAI 的视觉模型分析照片，返回：
  - 肤色深浅、冷暖调、甲床、指形和指甲状况
  - 4 款不同方向的推荐，每款附配色色值、适合的原因、甲型、质感和维护难度
- **效果图生成**（2 点/张）：可以直接生成推荐款，也可以按顾客自己的描述生成。按描述生成时，AI 先把描述变成精确的设计，再交给图像模型，在原照片上只改指甲。
- **包容性设计**：
  - 配色建议只看照片里能看到的肤色深浅和冷暖调，**不推测种族或民族**；顾客可以手动校正肤色。
  - 男士美甲有一套单独的设计规则（干净的短甲、哑光护甲、深色纯色、极简线条等）。
  - 内置 18 个国家/地区的流行趋势：中国、港澳台、日本、韩国、东南亚、印度、中东、美国、加拿大、拉美、英国、法国、欧洲其他国家、俄罗斯、西非、东非、南非、澳新。地区由顾客自己选，不根据外貌推断。
- **中英双语界面**：自动识别浏览器语言，也可以手动切换。
- **Creem 收费**：
  - 卖点数包（10 / 30 / 100 点），跳转到 Creem 的付款页面付款。
  - Creem 是"记录商户"（Merchant of Record），会代你处理各国销售税和发票。
  - Webhook 验证签名后才加点数，同一笔付款只会入账一次。
  - AI 调用失败或照片不合格时，自动退还点数。
- **隐私**：原始手部照片只在本次请求中使用，不会保存；上传时会去掉照片的 EXIF 信息（包括 GPS 位置）。

## 技术栈

Next.js 16（App Router）· TypeScript · Tailwind CSS 4 · PostgreSQL + Drizzle ORM · OpenAI API（看图分析 + 图像编辑，只需一个密钥）· Creem

| 文件 | 作用 |
| --- | --- |
| `src/lib/ai/analysis.ts` | AI 手部分析、推荐、把描述变成设计 |
| `src/lib/ai/image-model.ts` | 调用图像模型生成效果图（要换供应商只需改这个文件） |
| `src/lib/styles.ts` | 风格方向、地区审美、Monk 肤色量表 |
| `src/lib/pricing.ts` | 点数包价格（调价直接改这里） |
| `src/lib/credits.ts` | 每次操作消耗的点数，以及扣点、退点、入账 |
| `src/app/api/checkout` | 创建 Creem 付款页面 |
| `src/app/api/webhooks/creem` | Creem Webhook，付款成功后加点数 |
| `src/lib/i18n.ts` | 中英文文案 |

## 本地运行

```bash
npm install
cp .env.example .env.local   # 填入各项密钥
npm run db:migrate           # 在数据库中建表
npm run dev
```

本地测试付款时，Creem 需要一个公网地址才能把付款回调发到你的电脑。可以用 [ngrok](https://ngrok.com) 等工具把 `localhost:3000` 暴露出去，再把 `https://xxx.ngrok.app/api/webhooks/creem` 填到 Creem 测试模式的 Webhook 里。测试模式下可以用测试卡 `4242 4242 4242 4242` 付款。

## 上线收费步骤

1. **数据库**：在 [Neon](https://neon.tech) 创建一个 Postgres 数据库，拿到 `DATABASE_URL`。也可以在 Vercel 项目的 Storage 页面直接连接 Neon，Vercel 会自动填好 `DATABASE_URL`。
2. **部署**：
   - 推荐用 [Vercel](https://vercel.com)。导入本仓库，在 Environment Variables 里填入 `.env.example` 中的变量，`NEXT_PUBLIC_APP_URL` 填正式域名。
   - 每次部署都会运行 `vercel-build`，自动在数据库里建表或更新表结构，不用手动执行 `npm run db:migrate`。
   - 还没开通 Creem 时，不填 `CREEM_*` 变量即可：价格页会显示"在线支付即将开通"，其他功能正常可用。
   - 生成一张图可能需要 30–90 秒，`/api/generate` 设置了 `maxDuration = 300`。如果部署后生成时出现超时，请在 Vercel 项目设置里确认 Fluid Compute 已开启，并查看你的套餐允许的最长函数运行时间。
3. **Creem**（个人身份即可开通）：
   1. 在 [creem.io](https://www.creem.io) 注册，创建商店（Store），按提示完成身份验证和收款账户设置。收款方式和支持的国家以 Creem 后台显示为准，开通前请确认你能收到款。
   2. 在后台 **Products** 新建一个商品，比如叫「美甲设计点数」：
      - 付款类型选 **一次性付款**（One-time），不要选订阅。
      - 货币选 **USD**（要和 `src/lib/pricing.ts` 里的 `CURRENCY` 一致）。
      - 价格随便填，比如 $4.99。实际价格由网站在结账时按点数包自动设置（10 点 $4.99、30 点 $11.99、100 点 $29.99）。
      - 创建后复制商品 ID（`prod_` 开头），填入 `CREEM_PRODUCT_ID`。
   3. 在 **Developers** 页面复制 API Key，填入 `CREEM_API_KEY`。
   4. 在 **Developers → Webhooks** 添加 `https://你的域名/api/webhooks/creem`，至少勾选 `checkout.completed` 事件，把签名密钥填入 `CREEM_WEBHOOK_SECRET`。
   5. 先用**测试模式**（后台右上角切换 Test Mode）的密钥，并设置 `CREEM_TEST_MODE=true`，跑通一次付款。正式上线时，换成正式模式的 API Key、商品 ID 和 Webhook 密钥，并把 `CREEM_TEST_MODE` 删掉或设为 `false`。测试模式和正式模式的商品、密钥互不通用。
4. **API 密钥**：只需要一个 OpenAI 密钥。在 [OpenAI 平台](https://platform.openai.com/api-keys) 创建密钥并充值，然后完成组织验证（Settings → Organization → Verify），否则图片生成会被拒绝。

## 成本与定价参考

- 每次 AI 分析大约花几美分。
- 每张效果图约 $0.05–0.25，具体取决于 `OPENAI_IMAGE_QUALITY`。
- 默认售价约 $0.30–0.50/点：分析 1 点，效果图 2 点，留有利润空间。

上线前请按实际账单调整 `src/lib/pricing.ts` 和 `src/lib/credits.ts`。

## 后续可以做

- 把生成的图片从数据库转存到对象存储（S3 / R2），减轻数据库负担。
- 登录增加邮箱验证和找回密码，或者接入 Google / Apple 登录。
- 给接口加限流，防止滥用。
- 处理 Creem 的 `refund.created` 退款事件，退款后自动扣回点数（目前退款要在后台手动处理）。
- 增加更多界面语言（西班牙语、法语、阿拉伯语等）。
