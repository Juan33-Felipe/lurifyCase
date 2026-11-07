# Rediseño del login con un kit de componentes estilo Apple

Fecha: 2026-11-07
Proyecto: `mobile/` (Expo SDK 58, React Native 0.88, NativeWind, Reanimated 4)
Mockup aprobado: `.superpowers/brainstorm/1437-1794044420/content/login-a-v3.html`, que es local y está ignorado por git. Las capturas y la descripción de este documento son la referencia.

## Intención

El usuario quiere que la app se sienta como una app nativa de iPhone. Su referencia visual es una app de wallet para iOS, con una tarjeta superior lavanda, una cifra enorme en tipografía bold, botones en forma de píldora con el ícono dentro de un círculo, tarjetas blancas redondeadas sobre gris claro y controles de vidrio. Le gustan esos componentes y los quiere como base visual de toda la app.

El primer paso es el login. Hay que construir un **kit de componentes estilo Apple** reutilizable y rehacer la pantalla de login con él. Después, el resto de las pantallas migrará al mismo kit, pero eso queda fuera de este proyecto.

## Objetivos

1. Crear un kit de componentes estilo Apple en `mobile/`, pensado para reutilizarse en las demás pantallas.
2. Rehacer `mobile/src/screens/LoginScreen.tsx` por completo con ese kit, siguiendo la dirección A, "tarjeta héroe", con vidrio claro.
3. Usar la tipografía de Apple (SF Pro) y los íconos de Apple (SF Symbols) en iPhone, con equivalentes libres en Android y web.
4. Conservar todo el comportamiento actual del login.

## Fuera de alcance

- El modo oscuro del login. Por ahora el login es **solo claro**, aunque la app esté en modo oscuro. Los componentes deben tener sus colores en tokens, para poder agregar una paleta oscura después sin rehacerlos.
- El rediseño de las demás pantallas: Dashboard, Mapa del caso, Auditoría, Ajustes y la hoja de nuevo caso.
- Recuperar la contraseña. El backend no tiene ese endpoint, así que no se agrega "¿Olvidaste tu contraseña?".
- El login con Apple, Google u otros proveedores.
- Cualquier cambio en el backend.
- Borrar o modificar `GlassButton`, `GlassInput` y `GlassView` de `src/components/ui` y `src/components/Glass.tsx`. Las otras pantallas siguen usándolos.

## Lo que sería un fracaso aunque funcione

- **Que se vea "hecho con IA".** El usuario rechaza esa estética: degradados chillones, brillos de neón, sombras de colores, emojis como íconos o vidrio exagerado. El vidrio debe ser sutil y creíble, como en iOS. La jerarquía la da la tipografía.
- Que se rompa el login real contra el backend, el registro o la validación.
- Que se rompan las otras pantallas por tocar componentes compartidos.
- Que se incluya la fuente SF Pro o los archivos de SF Symbols dentro de la app. La licencia de Apple solo permite usarlos en sus propias plataformas, mediante el sistema.

## Diseño de la pantalla (decidido con el usuario)

### Estructura de arriba hacia abajo

1. **Tarjeta héroe lavanda**
   - Ocupa todo el ancho, desde arriba de la barra de estado, con las esquinas inferiores redondeadas (unos 30 pt).
   - El fondo es un degradado vertical muy suave, de `#E9E6F7` a `#E2E4F6`.
   - Primera fila: "Iurify" en semibold, seguido de "Case" en gris, a la izquierda. A la derecha, un botón redondo de vidrio de unos 34 pt con un ícono de la marca.
   - Debajo: una línea pequeña en gris, por ejemplo "Bienvenido de nuevo". Después, un **titular grande** en bold de unos 40 pt, con interlineado ajustado y tracking negativo, partido en dos líneas: "Tus casos, / a salvo.".
   - **Sin el chip verde de "Cifrado AES-256"**. El usuario pidió quitarlo.
2. **Zona del formulario**
   - Fondo gris agrupado de iOS, `#F2F2F7`, con 2 o 3 manchas de color difuminadas detrás (lavanda `#CFC8F3`, celeste `#C9E7F2` y rosa `#F3D9E6`). Sin ellas, el vidrio no se lee.
   - **Selector segmentado de vidrio** con las opciones "Iniciar sesión" y "Crear cuenta". El segmento activo es blanco opaco con una sombra mínima y se desliza con animación.
   - **Campos agrupados** en una tarjeta blanca redondeada de unos 16 pt, al estilo de Ajustes de iOS. Cada fila lleva un ícono a la izquierda y el campo de texto, separadas por líneas de 0,5 pt.
   - **Fila de acciones:**
     - Un **botón píldora de vidrio claro** que ocupa el ancho disponible. Lleva el texto y, a la derecha, un ícono dentro de un círculo con borde fino.
   - Los mensajes de error van en línea, debajo de los campos, en rojo suave, con ícono y sin cajas llamativas.

### Estados

- **Iniciar sesión.** El héroe dice "Bienvenido de nuevo / Tus casos, a salvo.". Los campos son correo y contraseña, con un botón para mostrar u ocultar la contraseña. El botón principal dice "Iniciar sesión" con una flecha.
- **Crear cuenta.** El héroe dice "Crea tu cuenta / Empieza tu primer caso.". Los campos son nombre completo, correo, contraseña y confirmación. El botón dice "Crear cuenta" con un "+". No hay botón de biometría.
- **Sin estado bloqueado.** Por decisión del usuario, el login no tiene biometría. Si hay una sesión guardada, la app entra directo. `AuthContext` deja de usar el estado `locked`, y el interruptor de biometría de Ajustes deja de afectar al arranque.
- **Enviando.** El botón principal muestra un indicador de carga y se desactiva.
- **Error.** Se muestra el mensaje en línea. Se conserva el mapeo actual de códigos HTTP a textos.

### Biometría

El usuario decidió **quitar Face ID y la huella del login por completo**. No hay botón redondo de biometría, ni pantalla bloqueada, ni enlace "Usar otra cuenta". `GlassIconButton` sigue en el kit y se usa en el botón de marca del héroe.

## Tipografía

- **iOS:** la fuente del sistema, que es SF Pro. Se usa la familia del sistema de React Native, sin cargar archivos de fuente.
- **Android y web:** Inter, con `@expo-google-fonts/inter` en los pesos 400, 500, 600 y 700.
- Hay que definir una escala de estilos con nombre basada en Dynamic Type de iOS, de modo que las pantallas no escriban tamaños sueltos. Como mínimo:

| Estilo | Tamaño / interlineado | Peso |
|---|---|---|
| `display` | 40 / 41 | bold, con tracking negativo |
| `largeTitle` | 34 / 41 | bold |
| `title2` | 22 / 28 | bold |
| `headline` | 17 / 22 | semibold |
| `body` | 17 / 22 | regular |
| `subheadline` | 15 / 20 | regular |
| `footnote` | 13 / 18 | regular |
| `caption` | 12 / 16 | regular |

- Outfit, la fuente actual, sigue cargada para las demás pantallas. El login y el kit nuevo no la usan.

## Íconos

- Se usa `expo-symbols`, versión 58.0.4, compatible con SDK 58. Muestra SF Symbols reales en iOS y Material Symbols en Android y web.
- Cada ícono se declara una sola vez, con su nombre en SF Symbols y su equivalente en Material, mediante el objeto `name={{ ios, android, web }}` del paquete.
- En el login, los íconos reemplazan a los de `@expo/vector-icons` / MaterialIcons.

| Uso | SF Symbol | Material |
|---|---|---|
| Correo | `envelope` | `mail` |
| Contraseña y confirmación | `lock` | `lock` |
| Mostrar / ocultar contraseña | `eye` / `eye.slash` | `visibility` / `visibility_off` |
| Nombre | `person` | `person` |
| Iniciar sesión | `arrow.right` | `arrow_forward` |
| Crear cuenta | `plus` | `add` |
| Error | `exclamationmark.circle` | `error` |
| Marca, en el botón redondo del héroe | queda a criterio de quien construya, con algo jurídico y sobrio como `building.columns` | equivalente, por ejemplo `account_balance` |

## Vidrio

- **Vidrio claro** en todos los controles de vidrio: botón píldora, botón redondo y selector. No hay vidrio oscuro.
- **iOS 26 o superior:** si `expo-glass-effect` está disponible, se usa el Liquid Glass nativo mediante `GlassView` de ese paquete. Su disponibilidad se comprueba en tiempo de ejecución.
- **iOS anterior, Android y web:** se simula con `expo-blur`, que ya está instalado. Lleva un relleno blanco translúcido de arriba hacia abajo, de opacidad alta a media, un borde de 1 pt blanco casi opaco, un brillo interior en el borde superior y una sombra exterior neutra y suave.
- Si el vidrio, por estar muy transparente, no da suficiente contraste al texto del botón principal, se puede subir la opacidad del relleno. No se debe cambiar a vidrio oscuro.

## Kit de componentes

Va en una carpeta nueva y separada, por ejemplo `mobile/src/components/apple/`, con su propio `index.ts`, y con sus tokens en un archivo de tema propio. No se mezcla con `src/components/ui`, para no romper las demás pantallas.

Piezas mínimas, a partir de lo que necesita el login:

- **Tokens:** colores claros de iOS (fondo agrupado, superficie, etiquetas primarias y secundarias, separador, lavanda del héroe, manchas, rojo de error), radios, espaciado y la escala tipográfica. La estructura debe permitir agregar una paleta oscura después.
- **`Text`** con la prop `variant`, según la escala anterior y la fuente correcta en cada plataforma.
- **`Symbol`**, un envoltorio de `SymbolView` con el mapa iOS / Material, y tamaño, peso y color.
- **`GlassSurface`**, la base de vidrio con nativo o simulado, según la sección anterior.
- **`GlassButton`**, la píldora con etiqueta, ícono final en círculo, estados de carga y deshabilitado, y respuesta al toque con una escala sutil y sin rebote exagerado.
- **`GlassIconButton`**, el botón redondo.
- **`SegmentedControl`**, de vidrio, con segmento activo animado.
- **`GroupedSection`** y **`TextFieldRow`**, la tarjeta agrupada con filas, separadores e ícono, con soporte para contraseña con botón de mostrar, `ref` para pasar al siguiente campo y todas las props de `TextInput`.
- **`HeroCard`**, la tarjeta lavanda superior.
- **`AmbientBackground`**, el fondo gris con las manchas difuminadas.
- **`InlineMessage`**, el mensaje de error en línea.

Los nombres son sugerencias. Pueden coincidir con los de `src/components/ui`, porque viven en otra carpeta, pero se importan siempre desde la ruta del kit nuevo.

## Comportamiento que se conserva

- Validación en el cliente: campos vacíos, formato de correo, contraseña de al menos 6 caracteres al registrarse y contraseñas iguales.
- Llamadas a `signIn` y `signUp` de `AuthContext`, sin cambiar sus firmas.
- El mapeo de errores HTTP actual: 400, 401 y 422 en el login; 409 para correo duplicado y 400 y 422 en el registro; y el error de red cuando no hay respuesta.
- Al cambiar de pestaña se borra el error.
- Navegación con el teclado: "siguiente" pasa al próximo campo y "listo" envía. Se conservan `textContentType` y `autoComplete` para que funcione el autocompletado de contraseñas de iOS.
- `KeyboardAvoidingView` y el scroll cuando el teclado tapa el formulario, sobre todo en crear cuenta, que tiene 4 campos.
- Respeto de las zonas seguras: el héroe se extiende bajo la barra de estado, que debe quedar en texto oscuro.
- Todos los textos van en i18n, con claves nuevas en `src/i18n/translations.ts` en inglés y español. Las claves `login.*` que ya existen se reutilizan cuando aplican.
- Accesibilidad: `accessibilityLabel` y `accessibilityRole` en los botones de ícono, y un área táctil mínima de 44 pt.

## Restricciones técnicas

- Hay que seguir `mobile/AGENTS.md`. Para agregar paquetes se usa `npx expo install`, y antes de usar una API de Expo hay que consultar la documentación de la versión 58.
- `expo-symbols`, `expo-glass-effect` e `@expo-google-fonts/inter` son dependencias nuevas.
- Antes de cada commit hay que pasar `npx expo lint` y `npx tsc --noEmit`, dentro de `mobile/`.
- Las reglas de commits del `CLAUDE.md` de la raíz: un commit por cambio lógico, en español y sin atribución a IA.
- Hay que verificar en la app real, no solo con tests. Como mínimo en web con `npm run dev` y la tecla `w`, probando el login real contra el backend, el registro, los errores y el cambio de pestañas. Si hay un dispositivo disponible, también en Expo Go o en una build de desarrollo.

## Lo que queda a criterio de quien construya

- La API exacta y los nombres de los componentes del kit, y si se usa NativeWind o `StyleSheet` dentro del kit.
- Los valores finos de blur, opacidades, sombras y la posición de las manchas, siempre que se vea como el mockup aprobado y respete la sección de lo que sería un fracaso.
- Las animaciones de entrada y de transición entre pestañas, que deben ser sutiles.
- El ícono de marca del héroe.
- Los textos en inglés de las claves nuevas.

## Otras decisiones mías, tomadas al revisar el diseño

- **Pie de seguridad:** se quita la insignia "Cifrado / secure" que hoy aparece debajo de la tarjeta, por coherencia con el chip que el usuario pidió quitar. La clave `login.secure` puede quedar sin uso en esta pantalla.
- **Liquid Glass forzado a claro:** también cuando el sistema está en modo oscuro.
- **Teclado:** el héroe se desplaza junto con el formulario cuando el teclado está abierto. No queda fijo.
- **`App.tsx` se puede tocar:**
  - El login deja de ir dentro del `GlassBackground` actual y usa su propio fondo.
  - La barra de estado se fuerza a texto oscuro en el login.
  - Inter se carga en el `useFonts` que ya existe.
