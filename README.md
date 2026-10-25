# Phys-In - Interactive Physics Simulations

Interactive physics simulations in electromagnetic radiation, thermodynamics, mechanics, and more. Every simulation has adjustable variables, so complex ideas are more easily understood.

See the site on https://physin.org.

The simulations always have a link to the relevant section in The Feynman Lectures on Physics, as that book is the main inspiration for the project, and every simulation is explained in the Lectures.

## Notes on the source code
The project uses the [Diagramatics](https://diagramatics.photon-ray.xyz/) library, a great
2D SVG renderer designed for interactive diagrams.

I have patched its source code a bit, so the "locator" objects can be bounded inside a circle or a rectangle, otherwise it is the original library.

