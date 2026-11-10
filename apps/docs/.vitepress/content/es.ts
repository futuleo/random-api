import { type GuidePages, snippets } from "./shared";

export const es: GuidePages = {
  index: `---
layout: home
hero:
  name: Random API
  text: Estructura real. Datos sintéticos.
  tagline: Guías prácticas para generar datos locales en la web, el escritorio y la terminal.
  actions:
    - theme: brand
      text: Primeros pasos
      link: /es/getting-started
    - theme: alt
      text: Explorar 30 escenarios
      link: /es/scenarios
    - theme: alt
      text: Aprender rgen
      link: /es/cli
features:
  - title: Un motor compartido
    details: Web, Electron, CLI y REST usan el mismo núcleo.
    link: /es/architecture
  - title: Datos de prueba reproducibles
    details: Genera entre 1 y 1000 objetos con rangos y opciones explícitas.
    link: /es/generators
  - title: Local desde el diseño
    details: Sin cuentas, cargas del documento original ni integración con LLM.
    link: /es/architecture
---
`,
  "getting-started": `# Primeros pasos

Random API genera datos de prueba a partir de una estructura JSON. Sirve para prototipos, tablas, demostraciones y pruebas. **No es un anonimizador** ni garantiza relaciones de bases de datos.

## Ejecutar desde el código fuente

Usa **Node.js 24** y la versión de pnpm fijada en el repositorio. Desde la raíz:
${snippets.setup}
Abre la dirección local indicada por Vite. La web y Electron no necesitan el servidor REST.

## Tu primer conjunto de datos

1. Selecciona un escenario o pega un objeto JSON.
2. Revisa los campos y configura sus generadores.
3. Ajusta la cantidad y genera los datos.
4. Comprueba el resultado y exporta JSON, CSV, XML o JSONL.

Guarda este ejemplo como \`source.json\`:
${snippets.fixture}
Los [generadores](/es/generators) explican cómo preparar \`fields.json\`.

## Elegir una interfaz

Usa [web y escritorio](/es/web-desktop) para editar visualmente, [rgen](/es/cli) para scripts y CI, o [REST local](/es/rest) para otros programas locales.

## Idiomas

Se admiten \`en\`, \`fi\`, \`sv\`, \`ru\` y \`es\`. Los identificadores de escenarios, rutas de campos y códigos de máquina permanecen estables. Las opciones personalizadas no se traducen automáticamente.

::: warning Antes de compartir
Se conservan los nombres de claves y la estructura. Los campos se generan independientemente; no se garantiza coherencia entre fechas, importes o identificadores.
:::
`,
  "web-desktop": `# Web y escritorio

La aplicación procesa el documento en el dispositivo y no necesita REST.

Usa **Idioma** para cambiar la interfaz, los avisos, los escenarios y los valores compatibles entre inglés, finés, sueco, ruso y español. Las claves JSON y los ajustes personalizados se conservan. Cambiar de idioma borra el resultado anterior para no confundirlo con una nueva generación.

## Flujo de trabajo

Ejecuta \`pnpm dev\`, pega JSON o importa un archivo. El selector de escenarios permanece visible encima del documento; la biblioteca permite buscar y filtrar los 30 escenarios.

En pantallas estrechas el orden es: documento → campos → controles → resultado → exportación. Cada generación utiliza una semilla nueva; no es necesario configurarla.

El número de objetos admite **1–1000** con un objeto o un array no vacío de objetos. Las plantillas del array se reutilizan cíclicamente. Otras raíces conservan su forma. Los arrays anidados mantienen su estructura. Límites: profundidad 100 y 100 000 valores de salida.

## Electron

\`\`\`sh
pnpm dev:desktop
pnpm package:desktop
\`\`\`

Electron reutiliza la web con aislamiento de contexto, sandbox y Node desactivado en el renderer. La compilación macOS no está firmada ni notarizada. No se ha verificado la ejecución de los paquetes Windows o Linux.

## Problemas habituales

Comprueba comillas y comas si el JSON no es válido. Reduce la cantidad si se supera el límite de valores. Un error de XML no borra el resultado: vuelve a JSON o elige otro formato.
`,
  cli: `# Comando rgen

CLI independiente y local. No inicia ni contacta con REST.

## Instalación

Usa Node.js 24. Construye el paquete desde la raíz y después instálalo:
${snippets.install}
El paquete incluye el núcleo; no necesita dependencias de este monorepositorio al ejecutarse. \`randomapi-studio\` es un nombre previsto, **no una reserva ni una publicación confirmada**.

## Comandos

\`\`\`sh
rgen scenarios --locale es
rgen scenario users --count 25 --locale es
rgen generate -i source.json --fields fields.json --locale es
rgen inspect -i source.json
rgen scenario products --format xml -o products.xml
rgen scenario orders --format jsonl
rgen --help
rgen --version
\`\`\`

También se admiten \`--scenario\`, \`--list-scenarios\` y \`--generate\`. No combines \`--input\` y \`--scenario\`.

| Opción | Uso |
| --- | --- |
| \`-i, --input <archivo>\` | Leer JSON; por defecto, inspeccionar rutas |
| \`-n, --count <1-1000>\` | Número de objetos |
| \`--seed <texto>\` | Semilla reproducible; por defecto \`random-api\` |
| \`--locale en\\|fi\\|sv\\|ru\\|es\` | Idioma de nombres y escenarios |
| \`--fields <archivo>\` | Configuración JSON de campos |
| \`--field <ruta=generador>\` | Atajo repetible con una ruta JSON |
| \`--format json\\|csv\\|xml\\|jsonl\` | Formato de salida |
| \`-o, --output <archivo>\` | Crear un archivo nuevo sin sobrescribir |

La salida va a stdout y los errores a stderr con código de salida distinto de cero. La redirección del shell sí puede sobrescribir; \`--output\` no. Fija versión, semilla, idioma y configuración en CI.
`,
  generators: `# Generadores y exportación

## Configuración de campos
${snippets.fields}
Cada campo tiene \`path\` y \`generator\`. \`["profile","name"]\` es una ruta anidada; \`["profile.name"]\` es una clave literal con punto.

Los generadores son \`auto\`, \`email\`, \`name\`, \`date\`, \`uuid\`, \`string\`, \`number\`, \`boolean\` y \`enum\`. \`auto\` conserva el comportamiento del tipo original y no está permitido en REST.

\`number\` acepta límites enteros inclusivos \`min\` y \`max\` entre −1 000 000 000 y 1 000 000 000; por defecto 0–999999. \`enum\` admite 1–50 cadenas únicas, no vacías, de hasta 256 caracteres. No se deducen opciones de los valores originales.

Los nombres y textos sintéticos usan el idioma seleccionado. Las etiquetas humanas de los escenarios se traducen; las rutas, identificadores y códigos de máquina no. Las opciones del usuario permanecen literales.

## Formatos de exportación

**JSON** conserva objetos, arrays y tipos. **CSV** aplana objetos con rutas JSON como cabeceras; los arrays anidados se guardan en celdas JSON. Las cadenas con prefijos de fórmulas se neutralizan.

**JSONL** escribe un valor JSON por elemento del array raíz, o una línea si la raíz no es un array. Un array vacío produce un archivo vacío.

**XML** usa \`data\`, \`item\` y \`field name="…"\`, con atributos \`type\` para conservar tipos. Escapa los caracteres reservados, no usa DTD y rechaza caracteres no válidos en XML 1.0.

## Uso del núcleo en el repositorio
${snippets.core}
El paquete core es interno; no se anuncia un SDK público en npm. Los UUID y la aleatoriedad con semilla son utilidades de pruebas, no credenciales.
`,
  rest: `# API REST local

Adaptador opcional limitado a loopback. Nunca envíes el documento original.
${snippets.rest}
La dirección por defecto es \`127.0.0.1:3000\`; \`PORT\` cambia el puerto.

## Contrato

\`GET /\` muestra la referencia, \`GET /health\` comprueba el estado y \`POST /generate\` genera datos. Se requieren \`seed\` no vacío de hasta 256 caracteres, \`count\` de 1–1000 y 1–200 campos explícitos. \`locale\` y \`format\` son opcionales; formatos JSON, CSV, XML y JSONL.

Sólo se admiten rutas y ajustes explícitos. No envíes ejemplos, tipos inferidos, longitudes ni opciones extraídas del documento. Los rangos numéricos y opciones enum son decisiones explícitas del usuario.

## Límites

Cuerpo máximo de 64 KiB, 120 peticiones por minuto para el proceso y rechazo de POST con cabecera \`Origin\`. Errores 400 sin fragmentos del documento, 429 con \`Retry-After\` y errores inesperados 500 genéricos. Sin registro de peticiones; respuestas \`no-store\`.

No hay autenticación. No expongas el servicio mediante túneles, proxies ni redes compartidas. Las comprobaciones de Host y Origin no sustituyen la autenticación.
`,
  architecture: `# Arquitectura y privacidad

## Paquetes

| Ruta | Responsabilidad |
| --- | --- |
| \`packages/core\` | Motor puro sin red, archivos, UI ni variables de entorno |
| \`apps/web\` | React/Vite, procesamiento local del documento |
| \`apps/desktop\` | Electron reutiliza la web |
| \`apps/cli\` | Adaptador Node.js y comando rgen |
| \`apps/api\` | REST Fastify local y limitado |
| \`apps/docs\` | Documentación VitePress estática |

El catálogo y sus ejemplos se construyen desde los 30 escenarios reales del core. No hay un paquete LLM ni integración con proveedores.

## Contrato de privacidad

Los valores originales permanecen en el dispositivo. No se envían a registros, analítica, informes de fallos, renderizado de servidor ni proveedores.

Una integración futura sólo podría enviar nombres de claves y sus rutas mediante una lista explícita de campos permitidos. Los tipos inferidos, longitudes, valores y enums requieren otra decisión de producto.

Las claves se consideran nombres de campos; no se detecta información sensible dentro de ellas. Los datos sintéticos **no garantizan anonimización**. No guardes claves API en el repositorio ni en localStorage.

## Documentación y desarrollo

La búsqueda usa un índice local, sin servicio externo ni fuentes remotas. Un alojamiento público puede conservar sus propios registros de acceso.

\`\`\`sh
pnpm dev:docs
pnpm docs:build
pnpm docs:preview
pnpm format
pnpm check
pnpm test:desktop
\`\`\`

Publica \`apps/docs/.vitepress/dist\` en un alojamiento estático. Para una subruta, configura \`DOCS_BASE=/prefijo/\` con barra final. La compilación no necesita red una vez instaladas las dependencias.
`,
};
