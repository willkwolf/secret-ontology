# Ontología del Secreto — Grafo Epistémico Modal Dinámico

Una experiencia de *scrollytelling* filosófico que explora la **ontología del secreto** mediante lógica modal formal y un grafo de fuerzas D3.js interactivo.

> *"¿Cuál es el mejor secreto posible?"*

## Demo en vivo / Live demo

Desplegado en GitHub Pages:  
`https://willkwolf.github.io/secret-ontology/`

---

## ¿Qué es?

Un artefacto web que cartografía el espacio entre el conocimiento, la ignorancia y lo incognoscible. Construido sobre:

- **Lógica modal epistémica** (semántica de Kripke, mundos posibles)
- **Lógica Epistémica Dinámica (DEL)** — las aristas son transformaciones epistémicas tipificadas
- **D3.js v7** — grafo dirigido con fuerzas, aristas semánticas y panel de detalle por nodo
- ***Scrollytelling*** — narrativa progresiva con Intersection Observer API

Cinco tipos de arista con semántica visual propia: *revelación*, *ocultamiento*, *emergencia*, *compresión*, *bifurcación*.

---

## Estructura del proyecto

```
/
├── index.html              # Punto de entrada
├── css/
│   └── main.css            # Estilos (mobile-first, WCAG AA)
├── js/
│   ├── app.js              # Bootstrap, animaciones, i18n wiring
│   ├── graph.js            # Motor D3.js del grafo
│   └── i18n.js             # Internacionalización (es / en)
├── data/
│   ├── graph-data.json     # Nodos, aristas y metadatos semánticos
│   └── i18n.json           # Cadenas de UI en español e inglés
├── .github/
│   └── workflows/
│       └── deploy.yml      # Pipeline de GitHub Pages
└── README.md
```

## Desarrollo local

Sin paso de compilación — abre `index.html` directamente en el navegador, o sirve con cualquier servidor estático:

```bash
npx serve .
# o bien
python -m http.server 8080
```

## Despliegue en GitHub Pages

Haz push a la rama `main`. El workflow de GitHub Actions (`.github/workflows/deploy.yml`) despliega automáticamente el sitio usando la API nativa de GitHub Pages.

Requiere que **GitHub Pages** esté habilitado en: Settings → Pages → Source: **GitHub Actions**.

---

## Licencia / License

**Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0)**

Puedes reutilizar, adaptar y redistribuir este trabajo — incluso con fines comerciales — siempre que otorgues el crédito correspondiente y distribuyas las obras derivadas bajo la misma licencia.

> Citar como / Cite as:  
> *Ontología del Secreto — Grafo Epistémico Modal Dinámico* (2026).  
> Colectivo de Investigación. CC BY-SA 4.0.  
> https://willkwolf.github.io/secret-ontology/

---

## Referencias filosóficas

Saul Kripke · Jaakko Hintikka · Johan van Benthem · Alexandru Baltag · Ronald Fagin · Joseph Halpern · David Chalmers · Kurt Gödel · Gregory Chaitin · Luciano Floridi

---

## English summary

An interactive philosophical scrollytelling experience exploring the ontology of secrecy through modal epistemic logic and a live D3.js force graph. The narrative builds five extreme epistemic worlds (total transparency, total opacity, eternal knowledge, finite regenerative cognition, non-dual epistemic collapse) and connects them with five typed directed edges representing epistemic transformations. Click any node to inspect its agents, accessible contents, and epistemic horizon. Filter edges by type. Switch the UI language between Spanish and English via the header button.

Stack: HTML5 · CSS3 · Vanilla JS (ES modules) · D3.js v7 · No build step.  
License: CC BY-SA 4.0.
