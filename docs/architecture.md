# Arquitectura V1

## Objetivo

La V1 de My Virtual Closet será una PWA local-first. No tendrá backend, API, autenticación, IA ni base de datos remota.

## Capas

- `app`: arranque, rutas y providers generales.
- `features`: funcionalidades aisladas por dominio.
- `infrastructure`: persistencia local y almacenamiento de imágenes.
- `shared`: componentes, hooks, tipos, constantes y utilidades reutilizables.
- `styles`: estilos globales.

## Features iniciales

### Wardrobe

Gestiona prendas, categorías, metadatos e imágenes.

### Outfits

Gestiona el constructor de outfits, combinaciones guardadas y selección aleatoria.

### Settings

Configuración local de la aplicación.

## Persistencia prevista

La persistencia será implementada con Dexie sobre IndexedDB.

Tablas previstas:

- `garments`
- `garmentImages`
- `outfits`
- `outfitItems`
- `settings`

## Principio de diseño

Las interfaces de repositorio se mantendrán separadas de la implementación Dexie para facilitar una futura migración a una API remota sin reescribir la interfaz de usuario ni la lógica de negocio.
