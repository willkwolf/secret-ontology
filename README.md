# Ontología del Secreto — Grafo Epistémico Modal Dinámico

Un laboratorio conceptual interactivo que cartografía las fronteras entre el conocimiento, la ignorancia y lo incognoscible mediante lógica modal formal y un grafo de fuerzas dinámico (D3.js).

> **Pregunta axial:** *«¿Cuál es el mejor secreto posible?»*
> 
> Esta interrogante no constituye un mero ejercicio de curiosidad intelectual estática. Es un **vector de investigación activo y riguroso** en la intersección de la lógica formal, la teoría de la información, la física cuántica y la criptografía de frontera. 

---

## Un Artefacto en Constante Evolución Epistémica

Este proyecto no está diseñado como una pieza de exhibición inmutable, sino como un **modelo dinámico y abierto**. Su propósito es ofrecer una herramienta legible y formalizada para habitar la paradoja del secreto, un campo que se investiga activamente desde diversos frentes:

1. **La Termodinámica de la Información (Shannon, Boltzmann, Landauer):** Mantener asimetrías epistémicas estables (que un agente sepa algo que otro ignora) exige un trabajo físico y computacional continuo. La disipación irreversible de energía para borrar o resguardar trazas informativas plantea límites reales y termodinámicos a la permanencia de la asimetría.
2. **Membranas Epistémicas y Sistemas Complejos:** El secreto actúa como una membrana de frontera indispensable para la autoorganización y preservación de la identidad sistémica (autopoiesis). La transparencia total equivale a la homogeneidad absoluta o muerte térmica del sistema.
3. **Fronteras Físicas y Lógicas Absolutas:** El proyecto integra restricciones intrínsecas a la computación y la realidad: los teoremas de incompletitud de **Gödel**, la incomputabilidad de **Turing**, la indeterminación cuántica de **Heisenberg** y el desarrollo contemporáneo de **Zero-Knowledge Proofs (ZKP)** —destacando la criptografía de *Zero-Knowledge Efectivo* (Rahul Ilango)— donde la imposibilidad física y lógica de demostración se utiliza activamente como la propia materia prima de la seguridad y el secreto.
4. **La Paradoja de la Autoaplicación:** El núcleo del scrollytelling aborda la imposibilidad de representar un secreto perfecto sin disolverlo. Mediante la semántica de Kripke y accesibilidades restringidas, el modelo demuestra que los secretos más potentes no son contenidos planos, sino transiciones dinámicas que impulsan a los agentes a expandir su horizonte modal ($\Delta H$).

---

## Estructura del Modelo (Arquitectura de Capas)

El artefacto implementa una metodología estructurada en capas superpuestas pero conmutables:
* **Capa de Topología Global:** Relación y tensión del espacio epistémico definido por cinco mundos extremos como polos modales ($w_T, w_O, w_E, w_F, w_N$).
* **Capa Epistémica:** Relaciones locales e interacciones dinámicas mediante aristas tipificadas de revelación, ocultamiento, emergencia, compresión, bifurcación, imposibilidad, entre otras.
* **Capa Temporal:** Animación y pulso del horizonte cognitivo móvil, reflejando cómo cada descubrimiento regenera y ensancha la frontera de la ignorancia.
* **Capa Metalógica:** Reglas y limitaciones lógicas específicas que gobiernan cada dominio regional del grafo.

---

## Estructura del Repositorio

```
/
├── index.html              # Interfaz interactiva y narrativa (scrollytelling)
├── css/
│   └── main.css            # Estilos (visualización premium, responsive, WCAG AA)
├── js/
│   ├── app.js              # Bootstrap, simulación y coordinación de la UI
│   ├── graph.js            # Motor del grafo dinámico D3.js (capas y recorridos)
│   ├── layers.js           # Sistema de estados y conmutación de capas epistémicas
│   ├── micro-graphs.js     # Inicialización y control de simuladores dinámicos
│   └── i18n.js             # Controlador de localización (Español / Inglés)
├── data/
│   ├── graph-data.json     # Estructura del grafo: nodos, aristas y horizontes
│   └── i18n.json           # Cadenas de traducción de la macronarrativa y la UI
└── README.md
```

## Desarrollo Local

El artefacto no requiere pasos de compilación complejos, asegurando su robustez y vigencia tecnológica a largo plazo. Puede servirse localmente con cualquier servidor estático ligero:

```bash
python -m http.server 8080
# o bien
npx serve .
```

---

## Licencia y Cita

**Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0)**

Puedes reutilizar, adaptar y redistribuir este trabajo siempre que otorgues el crédito correspondiente y distribuyas las obras derivadas bajo la misma licencia.

> *Ontología del Secreto — Grafo Epistémico Modal Dinámico* (2026-Presente).  
> Colectivo de Investigación en Epistemología Formal.  
> https://willkwolf.github.io/secret-ontology/
