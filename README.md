# Ontología del Secreto

> **Scrollytelling Interactivo & Grafo Epistémico Modal Dinámico**  
> Un artefacto libre de hermenéutica filosófica, lógica modal y visualización de datos (*Arte + Ciencia + Dataísmo*).

[![CC BY-SA 4.0](https://img.shields.io/badge/License-CC%20BY--SA%204.0-blue.svg)](https://creativecommons.org/licenses/by-sa/4.0/)

---

## ✦ Propósito

Cartografiar la relación entre **contenido** ($C$), **agente** ($a$) y **mundo epistémico** ($w$) formalizado en Lógica Modal:

$$\text{Secret}(C, a, w) \equiv C \land \neg K_a(C, w)$$

Explora si el "mejor secreto posible" es el más hermético, un misterio estructural, una prueba de Zero-Knowledge (ZKP) o aquel cuya revelación expande al máximo el horizonte de la ignorancia ($\Delta H$).

---

## ✦ Características

- **Diseño Dual Claro/Oscuro:** Sistema de temas nativo con persistencia y preferencia del sistema.
- **Grafo D3.js de 5 Capas:** Topología Modal, Red Epistémica, Frontera Temporal, Metalógica y Narrativa.
- **Simulador Modal Interactivo (§03):** Desafíos epistémicos en vivo para experimentar la fórmula.
- **Límites Estructurales (§05c):** Tarjetas de los límites de Gödel, Turing, Heisenberg, Caos y Entropía.
- **Internacionalización Nativa:** Conmutador fluido en tiempo real entre Español (ES) e Inglés (EN).
- **Accesibilidad Total (WCAG 2.1 AA):** Navegación por teclado, modo de alto contraste y semántica HTML5.

---

## ✦ Arquitectura del Proyecto

```text
secret-ontology/
├── index.html          # HTML5 semántico y scrollytelling
├── css/main.css        # Sistema de diseño, temas duales y tipografía modal
├── js/
│   ├── app.js          # Bootstrap, simulación y coordinación de la UI
│   ├── graph.js        # Motor del grafo dinámico D3.js (capas y recorridos)
│   ├── micro-graphs.js # Micro-grafos interactivos para Kripke y simulación
│   ├── layers.js       # Gestor de capas epistémicas
│   └── i18n.js         # Motor de internacionalización ES/EN
├── data/
│   ├── graph-data.json # Grafo modal: nodos, aristas y horizontes
│   └── i18n.json       # Diccionario bilingüe (ES / EN)
└── tests/              # Pruebas e2e defensivas de UI/UX (Playwright)
```

---

## ✦ Desarrollo y Verificación Local

Servir localmente con cualquier servidor de archivos estáticos:

```bash
# Servidor Python
python -m http.server 8080

# O bien ejecutar suite defensiva de Playwright (8 tests)
npm test
```

---

## ✦ Producción / Despliegue

Sitio publicado en GitHub Pages:  
👉 **[willkwolf.github.io/secret-ontology](https://willkwolf.github.io/secret-ontology/)**

---

## ✦ Licencia

[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) — William Camilo Artunduaga Viana (2026).
