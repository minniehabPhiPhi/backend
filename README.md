# Lunch Delivery API

Backend ใช้ Express + TypeScript และแยกหน้าที่ตาม MVC โดย Angular ใน `project_webAdv/` ทำหน้าที่เป็น View

```text
src/
  config/         # ตั้งค่า environment, MySQL, CORS, JWT และ Multer
  models/         # export interface สำหรับโครงสร้างข้อมูลเท่านั้น
  repositories/   # คำสั่ง SQL ที่รับและคืนข้อมูลตาม interface ใน models
  controllers/    # รับ request, เรียก repository และส่ง response
  routes/         # จับคู่ URL และ HTTP method กับ controller
  middlewares/    # ตรวจ JWT และจัดการ error
  utils/          # ฟังก์ชันสร้างและตรวจ token
  tests/          # ชุดทดสอบ API ที่เขียนด้วย TypeScript
  app.ts          # ประกอบ Express app และ middleware
  server.ts       # เปิด HTTP server
```

การทำงาน: `Request -> Route -> Controller -> Repository -> MySQL` แล้วส่ง JSON กลับไปให้ Angular แสดงผล โดยใช้ interface จาก `models/` กำหนดชนิดข้อมูล

ตัวอย่าง model ใน `src/models/customer.model.ts`:

```ts
export interface CustomerPostRequest {
  first_name: string;
  last_name: string;
  phone_number: string;
  latitude: number;
  longitude: number;
  address_detail: string;
}
```

## เริ่มใช้งาน

ใช้ Node.js 20.12 ขึ้นไป

1. ติดตั้ง dependencies ด้วย `npm install`
2. สำหรับการติดตั้งใหม่ คัดลอก `.env.example` เป็น `.env` แล้วตั้งค่าฐานข้อมูลและ `JWT_SECRET` (ค่าจากโปรเจคเดิมถูกย้ายไป `.env` ในเครื่องนี้แล้ว)
3. เริ่มพัฒนาด้วย `npm run dev`

```sh
npm run typecheck
npm run build
npm start
npm test
```

ค่าเริ่มต้นคือ `http://localhost:3000` และสามารถเปลี่ยนพอร์ตด้วย `PORT` ใน `.env`

`npm start` รัน `src/server.ts` โดยตรงผ่าน `tsx` ส่วน `npm run dev` จะเฝ้าดูการเปลี่ยนแปลงและเริ่ม server ใหม่อัตโนมัติ

`npm run build` และ `npm run typecheck` ตรวจชนิดข้อมูลทั้งหมดใน `src/` รวมถึงชุดทดสอบ ด้วย `noEmit: true` จึงไม่สร้างไฟล์ `.js`, `.js.map` หรือโฟลเดอร์ `dist/` โค้ด backend ทั้งหมดเป็น `.ts`; JavaScript ภายใน dependencies ของ npm ยังคงใช้ตามปกติ

## API

| Method | URL | หน้าที่ |
| --- | --- | --- |
| GET | `/api/customers?search=...` | รายชื่อลูกค้า / ค้นหาชื่อ |
| GET | `/api/customers/nearby?lat=...&lng=...&radius=1` | ลูกค้าใกล้พิกัด |
| POST | `/api/customers` | เพิ่มลูกค้า |
| PUT / DELETE | `/api/customers/:id` | แก้ไข / ลบลูกค้า |
| GET | `/api/orders` | รายการสั่งซื้อพร้อมข้อมูลลูกค้า |
| GET | `/api/orders/nearby?lat=...&lng=...&radius=2` | รายการสั่งซื้อใกล้พิกัด |
| POST | `/api/orders` | เพิ่มรายการสั่งซื้อ |
| POST | `/api/orders/seed` | สุ่มเพิ่มรายการสั่งซื้อ 20–30 รายการ |
| PUT / DELETE | `/api/orders/:id` | แก้ไข / ลบรายการสั่งซื้อ |
| DELETE | `/api/orders` | ลบรายการสั่งซื้อทั้งหมด |
| GET | `/api/jobs` | ใบงานไรเดอร์ทั้งหมดของรอบล่าสุด |
| GET | `/api/jobs/:code` | ใบงานใบเดียว เช่น `JOB-01` |
| PUT | `/api/jobs` | แทนที่ใบงานทั้งหมด body: `{ "jobs": [...] }` (หน้าจัดเส้นทางส่งมาหลังคำนวณ) |
| DELETE | `/api/jobs` | ล้างใบงานทั้งหมด |
| POST | `/upload` | อัปโหลดแบบ multipart/form-data ด้วย field `file` |
| GET | `/upload/:filename?download=true` | ดูไฟล์ / ดาวน์โหลด |
| GET | `/uploads/:filename` | เปิดไฟล์แบบ static |
| GET | `/testtoken` | สร้าง JWT สำหรับทดสอบ |

URL, HTTP status และรูปแบบ JSON ของ API ลูกค้าและรายการสั่งซื้อคงเดิม รวมถึงการเข้าถึง API เหล่านี้โดยไม่ต้องส่ง JWT ส่วน middleware JWT ยังคงตรวจเส้นทางอื่นตามพฤติกรรมเดิม

ไฟล์อัปโหลดทุก endpoint ใช้โฟลเดอร์เดียวกันที่รากโปรเจค (`uploads/`) ปรับได้ด้วย `UPLOAD_DIR` และจำกัดขนาด 64 MiB โดยปรับได้ด้วย `MAX_UPLOAD_SIZE`

`src/db.ts` และ `src/jwtauth.ts` เป็น compatibility exports สำหรับ import เดิม ส่วน implementation อยู่ในโฟลเดอร์ที่แยกไว้แล้ว

`npm test` จะตรวจชนิดข้อมูลและรัน `src/tests/api.test.ts` ผ่านฐานข้อมูลจำลอง พร้อมทดสอบอัปโหลดและดาวน์โหลดไฟล์จริงในโฟลเดอร์ชั่วคราว โดยไม่เชื่อมต่อหรือแก้ไขฐานข้อมูลจริง
