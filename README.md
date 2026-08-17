# My Virtual Closet

PWA local-first para gestionar un closet virtual, crear combinaciones de ropa y guardar outfits directamente en el dispositivo.

## Estado

Proyecto en fase inicial de arquitectura y estructura.

## Stack previsto para V1

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Dexie
- IndexedDB
- vite-plugin-pwa

## Alcance V1

La primera versión funcionará de forma local, sin API, autenticación, IA ni base de datos remota. Las prendas, outfits e imágenes se almacenarán en el dispositivo.

## Estructura

```text
public/
├── icons/
└── images/

src/
├── app/
├── features/
│   ├── wardrobe/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── ui/
│   │       ├── pages/
│   │       └── components/
│   ├── outfits/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── ui/
│   │       ├── pages/
│   │       └── components/
│   └── settings/
│       └── ui/
├── infrastructure/
│   ├── database/
│   └── storage/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── constants/
└── styles/

tests/
docs/
```

## Próximo paso

Inicializar Vite + React + TypeScript e incorporar las dependencias de la V1 sobre esta estructura.
