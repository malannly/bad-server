# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: __tests__\tests.spec.ts >> Проверка заказов >> Уязвимость телефона (без auth)
- Location: __tests__\tests.spec.ts:107:5

# Error details

```
Error: apiRequestContext.post: socket hang up
Call log:
  - → POST http://localhost:3000/order
    - user-agent: Playwright/1.61.1 (x64; windows 10.0) node/20.20
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 315

```

# Test source

```ts
  8   |   const csrfResponse = await request.get(`${process.env.API_URL}/auth/csrf-token`);
  9   |   if (csrfResponse.status() !== 200) {
  10  |     throw new Error(`Получение CSRF токена не удалось: ${csrfResponse.status()} ${csrfResponse.statusText()}`);
  11  |   }
  12  | 
  13  |   const { csrfToken } = await csrfResponse.json();
  14  |   if (!csrfToken) {
  15  |     throw new Error('CSRF токен отсутствует в ответе /auth/csrf-token');
  16  |   }
  17  | 
  18  |   return csrfToken;
  19  | };
  20  | 
  21  | const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
  22  | 
  23  | const requestWithRetry = async (
  24  |   request: any,
  25  |   method: 'get' | 'post',
  26  |   url: string,
  27  |   options: Record<string, any> = {},
  28  |   retries = 3,
  29  | ) => {
  30  |   let attempt = 0;
  31  |   let response;
  32  |   while (attempt <= retries) {
  33  |     response = await request[method](url, options);
  34  |     if (response.status() !== 429) {
  35  |       return response;
  36  |     }
  37  |     await wait(6000);
  38  |     attempt += 1;
  39  |   }
  40  |   return response;
  41  | };
  42  | 
  43  | test.describe('Проверка на уязвимость пакетов', () => {
  44  |   test('Аудит backend пакетов', () => {
  45  |     const result = shell.exec('npm audit', { cwd: `${process.env.GITHUB_WORKSPACE}/backend`, silent: true });
  46  |     expect(result.code).toEqual(0);
  47  |   });
  48  | 
  49  |   test('Аудит frontend пакетов', () => {
  50  |     const result = shell.exec('npm audit', { cwd: `${process.env.GITHUB_WORKSPACE}/frontend`, silent: true });
  51  |     expect(result.code).toEqual(0);
  52  |   });
  53  | });
  54  | 
  55  | test.describe('Проверка заказов', () => {
  56  |   test.afterEach(async () => {
  57  |     await new Promise(res => setTimeout(res, 3000));
  58  |   });
  59  | 
  60  |   test('Нормализован лимит', async ({ request }) => {
  61  |     const csrfToken = await getCsrfToken(request);
  62  |     const response = await requestWithRetry(request, 'get', `${process.env.API_URL}/order/all?page=2&limit=1000`, {
  63  |       headers: {
  64  |         'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
  65  |         'X-CSRF-Token': csrfToken,
  66  |       }
  67  |     });
  68  |     const data = await response.json();
  69  |     expect(response.ok()).toBeTruthy();
  70  |     expect(data.pagination.pageSize).toBeLessThanOrEqual(10);
  71  |   });
  72  | 
  73  |   test('При избыточной аггрегации, уязвимой к инъекции должна быть ошибка', async ({ request }) => {
  74  |     const csrfToken = await getCsrfToken(request);
  75  |     const response = await requestWithRetry(request, 'get', `${process.env.API_URL}/order/all?status[$expr][$function][body]='function%20(status)%20%7B%20return%20status%20%3D%3D%3D%20%22completed%22%20%7D'&status[$expr][$function][lang]=js&status[$expr][$function][args][0]=%24status`, {
  76  |       headers: {
  77  |         'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
  78  |         'X-CSRF-Token': csrfToken,
  79  |       }
  80  |     });
  81  |     expect(response.ok()).toBeFalsy();
  82  |   });
  83  | 
  84  |   test('Санитизирован комментарий', async ({ request }) => {
  85  |     const csrfToken = await getCsrfToken(request);
  86  |     const response = await requestWithRetry(request, 'post', `${process.env.API_URL}/order`, {
  87  |       headers: {
  88  |         'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
  89  |         'X-CSRF-Token': csrfToken,
  90  |       },
  91  |       data: {
  92  |         "payment": "online",
  93  |         "email": "test@test.ru",
  94  |         "phone": "+71234567890",
  95  |         "address": "Spb Vosstania 1",
  96  |         "total": 1450,
  97  |         "items": [
  98  |           "66601a8657ecac94459696d4"
  99  |         ],
  100 |         "comment": "Catch you <img src=\"https://placehold.co/1\" onload=\"javascript:(function () {window.alert('hello!')})();\">"
  101 |       }
  102 |     });
  103 |     const data = await response.json();
  104 |     expect(data.comment).not.toEqual("Catch you <img src=\"https://placehold.co/1\" onload=\"javascript:(function () {window.alert('hello!')})();\">");
  105 |   });
  106 | 
  107 | test('Уязвимость телефона (без auth)', async ({ request }) => {
> 108 |   const response = await request.post(`${process.env.API_URL}/order`, {
      |                                  ^ Error: apiRequestContext.post: socket hang up
  109 |     data: {
  110 |       address: "Васильевская 86",
  111 |       payment: "online",
  112 |       phone:
  113 |         "111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111a",
  114 |       total: 2200,
  115 |       email: "maxim_91@inbox.ru",
  116 |       items: [
  117 |         "66601a7857ecac94459696d0",
  118 |         "66601a8657ecac94459696d4",
  119 |       ],
  120 |     },
  121 |   });
  122 | 
  123 |   console.log('STATUS:', response.status());
  124 |   console.log('BODY:', await response.text());
  125 | 
  126 |   expect(response.status()).toBe(400);
  127 | });
  128 | 
  129 |   test('Проверка роли (у пользователя отсутствует доступ к базе всех заказов)', async ({ request }) => {
  130 |     const response = await requestWithRetry(request, 'get', `${process.env.API_URL}/order/all`, {
  131 |       headers: {
  132 |         'Authorization': `Bearer ${process.env.USER_TOKEN}`
  133 |       }
  134 |     });
  135 | 
  136 |     expect(response.ok()).toBeFalsy();
  137 |     expect(response.status()).toEqual(403);
  138 |   });
  139 | });
  140 | 
  141 | test.describe('Проверка пользователей', () => {
  142 |   test.afterEach(async () => {
  143 |     await new Promise(res => setTimeout(res, 3000));
  144 |   });
  145 | 
  146 |   test('Нормализован лимит', async ({ request }) => {
  147 |     const csrfToken = await getCsrfToken(request);
  148 |     const response = await requestWithRetry(request, 'get', `${process.env.API_URL}/customers?limit=1000`, {
  149 |       headers: {
  150 |         'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
  151 |         'X-CSRF-Token': csrfToken,
  152 |       }
  153 |     });
  154 |     const data = await response.json();
  155 |     expect(response.ok()).toBeTruthy();
  156 |     expect(data.pagination.pageSize).toBeLessThanOrEqual(10);
  157 |   });
  158 | 
  159 |   test('Экранирование при поиске', async ({ request }) => {
  160 |     const csrfToken = await getCsrfToken(request);
  161 |     const response = await requestWithRetry(request, 'get', `${process.env.API_URL}/customers?search=1+{}$()`, {
  162 |       headers: {
  163 |         'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
  164 |         'X-CSRF-Token': csrfToken,
  165 |       }
  166 |     });
  167 |     expect(response.ok()).toBeTruthy();
  168 |   });
  169 | 
  170 |   test('Проверка роли (у пользователя отсутствует доступ к базе всех пользователей)', async ({ request }) => {
  171 |     const response = await requestWithRetry(request, 'get', `${process.env.API_URL}/customers`, {
  172 |       headers: {
  173 |         'Authorization': `Bearer ${process.env.USER_TOKEN}`
  174 |       }
  175 |     });
  176 | 
  177 |     expect(response.ok()).toBeFalsy();
  178 |     expect(response.status()).toEqual(403);
  179 |   });
  180 | });
  181 | 
  182 | test.describe('Проверка загрузки файлов', () => {
  183 |   test.afterEach(async () => {
  184 |     await new Promise(res => setTimeout(res, 3000));
  185 |   });
  186 | 
  187 |   test('Нельзя использовать оригинальное имя файла при формировании пути', async ({ request }) => {
  188 |     const imagePath = path.join(process.cwd(), 'data/mimage.png');
  189 |     const image = fs.readFileSync(imagePath);
  190 | 
  191 |     const csrfToken = await getCsrfToken(request);
  192 |     const response = await requestWithRetry(request, 'post', `${process.env.API_URL}/upload`, {
  193 |       headers: {
  194 |         'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
  195 |         'X-CSRF-Token': csrfToken,
  196 |       },
  197 |       multipart: {
  198 |         file: {
  199 |           name: imagePath,
  200 |           mimeType: 'image/png',
  201 |           buffer: image
  202 |         }
  203 |       }
  204 |     });
  205 |     const data = await response.json();
  206 |     expect(response.ok()).toBeTruthy();
  207 |     expect(data.fileName).toBeDefined();
  208 | 
```