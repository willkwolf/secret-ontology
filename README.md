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

## Discusión Teórica y Límites del Artefacto

Este proyecto no es únicamente una herramienta visual; es una exploración interdisciplinar que intersecta la filosofía formal, la teoría de sistemas complejos, la física de la información y los límites de la computación. A continuación, se desglosan los vectores conceptuales que sostienen la obra y el formato integrado de sus limitaciones teóricas y técnicas.

### 1. La Termodinámica de la Información (Shannon, Boltzmann y Landauer)
El secreto es, por excelencia, un estado de **baja entropía**. Mantener asimetrías epistémicas estables (que un agente sepa algo que otro ignora) exige un trabajo físico y computacional continuo.
* **Coste de Mantenimiento (Landauer):** Ocultar información, borrar trazas o cifrar canales disipa calor de forma irreversible. El mantenimiento de un secreto consume energía física, cognitiva e institucional para resistir el empuje natural del universo hacia la disipación informativa (máxima entropía).
* **La Flecha del Tiempo Termodinámica:** El flujo del tiempo crea misterios estructurales irreversibles. Ciertos estados del pasado (por ejemplo, el microestado exacto de una partícula que ha sufrido decaimiento térmico) son inaccesibles por completo. La información necesaria para reconstruirlos se ha disipado en forma de calor disperso, erigiendo una barrera modal natural (aristas violetas de imposibilidad en el grafo).

### 2. Membranas Epistémicas y Emergencia de Sistemas
En la teoría de sistemas complejos y la autorganización, el secreto actúa como una membrana de frontera indispensable para la preservación de la identidad.
* **Autopoiesis y Diferenciación:** Un sistema complejo (un organismo, una mente, una sociedad) define su existencia estableciendo filtros severos sobre qué información asimila del entorno y cuál mantiene inaccesible.
* **El Peligro de la Transparencia Total:** Si el universo fuera enteramente transparente (simetría de conocimiento instantánea en todos los mundos posibles), el sistema colapsaría en una homogeneidad absoluta. Sin asimetrías de información, no hay flujo de energía ni dinamismo cognitivo. La transparencia total es equivalente a la **muerte térmica epistémica**.

### 3. Límites Estructurales Absolutos (No-Antropocéntricos)
La ontología del secreto culmina en fronteras físicas y lógicas que no dependen de la tecnología humana, sino que constituyen restricciones intrínsecas de la realidad física y formal:
* **Gödel (Incompletitud):** En cualquier sistema lógico formal capaz de expresar aritmética básica, existen proposiciones verdaderas que son indemostrables. La verdad excede constitutivamente a la prueba.
* **Turing (Incomputabilidad):** El problema de la parada demuestra que existen funciones bien definidas que ninguna máquina de estados finitos puede computar. Es una barrera de complejidad matemática absoluta.
* **Heisenberg (Indeterminación):** La naturaleza impone un límite infranqueable al conocimiento simultáneo de variables conjugadas (posición y momento). Intentar revelar el "secreto" cuántico mediante medición colapsa la función de onda y destruye el estado original del sistema.

### 4. La Paradoja de la Autoaplicación (¿El "Mejor" Secreto Posible?)
La pregunta conductora del scrollytelling —*«¿Cuál es el mejor secreto posible?»*— encierra una profunda paradoja autorreferencial (emparentada con las paradojas clásicas de Russell y Tarski):
* Si el artefacto o el grafo revelaran explícitamente y mostraran como contenido accesible el "mejor secreto posible" (Candidato 3: la singularidad que maximiza la reconfiguración epistémica $\Delta H$), **este dejaría de ser un secreto** al convertirse de inmediato en conocimiento común del agente y del observador ($K_a(C)$).
* **Solución Topológica:** Para resolver esto sin anular la consistencia lógica, el grafo modal del proyecto recurre a las barreras epistémicas de la lógica de Kripke. El "mejor secreto posible" y las singularidades estructurales no son contenidos descriptibles representados en un solo nodo plano; son transiciones dinámicas que impulsan al agente a expandir su horizonte modal, manteniendo los núcleos de misterio absoluto formalmente aislados detrás de aristas sin transitividad hacia el observador externo.

### 5. Limitaciones Consolidadas del Proyecto
Al orientar a los desarrolladores, filósofos e ingenieros que auditen o utilicen este repositorio, es preciso señalar las simplificaciones y límites que delimitan este modelo abstracto:
1. **Discretización Ontológica:** El grafo modela mediante nodos discretos (mundos posibles) y aristas dirigidas lo que en la realidad son procesos epistémicos continuos y transiciones analógicas de información.
2. **Exclusión de la Afectividad y Subjetividad:** El modelo es puramente formal (lógica modal de Kripke y DEL); no captura la fenomenología subjetiva del secreto, ni la dimensión afectiva, emocional o psíquica del ocultamiento.
3. **Paradoja de Representabilidad de la Opacidad:** Representar la incognoscibilidad absoluta mediante nodos delimitados visualmente en el plano D3 es performativamente contradictorio: al darle forma, etiqueta y coordenadas espaciales al misterio, se le dota de una presencia de la que carece conceptualmente.
4. **Simulación Temporal Lineal Aproximada:** La capa temporal que hace pulsar la luminiscencia de los nodos ilustra conceptualmente la difusión del conocimiento, pero no constituye un motor dinámico físicamente riguroso de simulación estocástica o caótica.
5. **Estilización de Categorías:** Las cinco categorías de aristas (*revelación*, *ocultamiento*, *emergencia*, *compresión*, *bifurcación*) son abstracciones heurísticas diseñadas para el scrollytelling y no agotan todas las transformaciones topológicas de la semántica de mundos posibles.

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
