# Gestion-Manager

Base de proyecto empresarial construida con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **Zod** y **React Hook Form**.

---

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **ORM / Base de Datos**: [Prisma](https://www.prisma.io/) (PostgreSQL)
- **Formularios & Validación**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/), `@hookform/resolvers`
- **Iconos & Utilidades**: [Lucide React](https://lucide.dev/), `clsx`, `tailwind-merge`

---

## 📁 Estructura del Proyecto

```
Gestion-Manager/
├── prisma/
│   └── schema.prisma         # Esquema de base de datos
├── src/
│   ├── app/                  # Rutas y páginas (App Router)
│   ├── components/
│   │   ├── dynamic-forms/    # Formularios dinámicos
│   │   ├── modules/          # Componentes específicos por módulo
│   │   └── ui/               # Componentes UI reutilizables (Botones, inputs, etc.)
│   ├── lib/
│   │   └── utils.ts          # Utilidades globales (helper `cn`)
│   ├── modules/              # Lógica de dominio y servicios modulares
│   └── types/                # Definiciones globales de TypeScript
├── .env.example              # Plantilla de variables de entorno
├── prisma.config.ts          # Configuración de Prisma 7
└── tsconfig.json             # Alias `@/*` -> `src/*`
```

---

## 🚀 Comenzando

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/aalvaroespinoza/Gestion-Manager.git
cd Gestion-Manager
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus credenciales:

```bash
cp .env.example .env
```

### 3. Base de datos con Prisma

```bash
npx prisma generate
```

### 4. Servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.
