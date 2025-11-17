import { Flashcard } from './types';

export const FLASHCARD_CONTENT: Flashcard[] = [
  // Term 3: Electric Circuits
  { term: "Simple Circuit", definition: "A closed loop that allows electricity to flow. It needs a power source (cell/battery), a conductor (wire), and a component (like a bulb)." },
  { term: "Circuit Diagram", definition: "A drawing that uses standard symbols to represent the components in an electrical circuit." },
  { 
    term: "Symbol: Cell", 
    definition: "Represents a single power source. A long line is positive (+) and a short line is negative (-).",
    symbol: `<svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" class="stroke-current"><line x1="0" y1="20" x2="35" y2="20" stroke-width="2"/><line x1="35" y1="5" x2="35" y2="35" stroke-width="2"/><line x1="45" y1="10" x2="45" y2="30" stroke-width="2"/><line x1="45" y1="20" x2="100" y2="20" stroke-width="2"/><text x="32" y="3" font-family="monospace" font-size="12" class="fill-current">+</text><text x="42" y="3" font-family="monospace" font-size="12" class="fill-current">-</text></svg>`
  },
  { 
    term: "Symbol: Battery", 
    definition: "A series of cells, providing more power.",
    symbol: `<svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" class="stroke-current"><line x1="0" y1="20" x2="25" y2="20" stroke-width="2"/><line x1="25" y1="5" x2="25" y2="35" stroke-width="2"/><line x1="35" y1="10" x2="35" y2="30" stroke-width="2"/><path d="M 40 20 L 50 20" stroke-width="2" stroke-dasharray="2,2"/><line x1="55" y1="5" x2="55" y2="35" stroke-width="2"/><line x1="65" y1="10" x2="65" y2="30" stroke-width="2"/><line x1="65" y1="20" x2="100" y2="20" stroke-width="2"/><text x="22" y="3" font-family="monospace" font-size="12" class="fill-current">+</text><text x="62" y="3" font-family="monospace" font-size="12" class="fill-current">-</text></svg>`
  },
  { 
    term: "Symbol: Light Bulb", 
    definition: "A component that produces light when electricity flows through it.",
    symbol: `<svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" class="stroke-current"><line x1="0" y1="20" x2="35" y2="20" stroke-width="2"/><circle cx="50" cy="20" r="15" stroke-width="2" fill="none"/><line x1="40" y1="10" x2="60" y2="30" stroke-width="2"/><line x1="40" y1="30" x2="60" y2="10" stroke-width="2"/><line x1="65" y1="20" x2="100" y2="20" stroke-width="2"/></svg>`
  },
  { 
    term: "Symbol: Switch (Open)", 
    definition: "A break in the circuit that stops the flow of electricity.",
    symbol: `<svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" class="stroke-current"><line x1="0" y1="20" x2="35" y2="20" stroke-width="2"/><circle cx="35" cy="20" r="3" stroke-width="2" class="fill-current"/><line x1="35" y1="20" x2="60" y2="10" stroke-width="2"/><circle cx="65" cy="20" r="3" stroke-width="2" class="fill-current"/><line x1="65" y1="20" x2="100" y2="20" stroke-width="2"/></svg>`
  },
  { 
    term: "Symbol: Switch (Closed)", 
    definition: "Completes the circuit, allowing electricity to flow.",
    symbol: `<svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" class="stroke-current"><line x1="0" y1="20" x2="100" y2="20" stroke-width="2"/><circle cx="35" cy="20" r="3" stroke-width="2" class="fill-current"/><circle cx="65" cy="20" r="3" stroke-width="2" class="fill-current"/></svg>`
  },
  { term: "Electrical Conductor", definition: "A material that allows electricity to pass through it easily, like copper, silver, and aluminum." },
  { term: "Electrical Insulator", definition: "A material that does not allow electricity to pass through it, like rubber, plastic, and glass." },
  { term: "Mains Electricity", definition: "The electricity supplied to homes and businesses from power stations. It is powerful and dangerous." },
  { term: "Fossil Fuels", definition: "Natural fuels such as coal, oil, and natural gas, formed from the remains of living organisms. They are burned in power stations to generate electricity." },
  { term: "Cost of Electricity", definition: "The amount of money you pay for the electrical energy you use, measured in kilowatt-hours (kWh)." },
  { term: "Illegal Connections", definition: "Connecting to the electricity grid without permission. It is extremely dangerous and can cause fires, electrocution, and power outages." },
  { term: "Renewable Energy", definition: "Energy from a source that is not depleted when used, such as wind, solar, or hydro power." },

  // Term 4: The Solar System
  { term: "Solar System", definition: "Consists of the Sun and everything that orbits it, including planets, asteroids, and moons." },
  { term: "The Sun", definition: "A star at the center of our solar system that provides heat and light. It is a giant ball of hot gas." },
  { term: "Planet", definition: "A large celestial body that orbits a star. Our solar system has 8 planets." },
  { term: "Asteroid", definition: "A small rocky body orbiting the sun. Many are found in the asteroid belt between Mars and Jupiter." },
  { term: "Moon", definition: "A natural satellite that orbits a planet." },
  { term: "Rotation of the Earth", definition: "The spinning of the Earth on its axis. It takes 24 hours and causes day and night." },
  { term: "Revolution of the Earth", definition: "The movement of the Earth in its orbit around the Sun. It takes 365.25 days (one year)." },
  { term: "Rotation of the Moon", definition: "The Moon spins on its own axis. It takes about 27.3 days, the same time it takes to orbit Earth." },
  { term: "Revolution of the Moon", definition: "The Moon's orbit around the Earth. It takes about 27.3 days." },
  { term: "Telescope", definition: "An instrument that uses lenses or mirrors to make distant objects appear closer and larger." },
  { term: "Rover", definition: "A vehicle designed to move across the surface of a planet or moon, like the rovers used on Mars and the Moon." },
];
