const product = (name, description, category, image = "") => ({
  name,
  description,
  category,
  image,
});

window.FLAVOR_CATEGORIES = [
  { key: "clasicos", label: "Sabores clásicos" },
  { key: "sin-azucar", label: "Sabores sin azúcar" },
  { key: "sin-lactosa", label: "Sabores sin lactosa" },
  { key: "sin-gluten", label: "Sabores sin gluten" },
  { key: "barritas-veganas", label: "Barritas veganas" },
  { key: "postres-con-azucar", label: "Postres con azúcar" },
  { key: "postres-sin-azucar", label: "Postres sin azúcar" },
  { key: "cucuruchos", label: "Cucuruchos" },
];

window.FLAVORS = [
  product("Abachoc", "Alfajor Havanna de dulce de leche", "clasicos"),
  product("Banana split", "Banana con dulce de leche", "clasicos"),
  product("Chocolate almendrado", "Con almendras tostadas", "clasicos"),
  product(
    "Chocolate amargo",
    "Para los que lo prefieren bien intenso",
    "clasicos",
  ),
  product(
    "Chocolate brownie",
    "Con trozos de brownie y un toque de licor",
    "clasicos",
  ),
  product(
    "Chocolate clásico",
    "Intenso y cremoso. También sin azúcar y sin gluten",
    "clasicos",
  ),
  product(
    "Chocolate Dubai",
    "Con pistachos tostados y crujiente de kadayif",
    "clasicos",
  ),
  product("Chocolate italiano", "Con pasas y ron", "clasicos"),
  product("Chocolate Kinder", "Suave y lechoso como el huevito", "clasicos"),
  product(
    "Chocolate Rocher",
    "Con avellanas y crocante",
    "clasicos",
    "assets/productos/chocolate-rocher.jpg",
  ),
  product("Chocolate split", "Chocolate y banana", "clasicos"),
  product(
    "Crema del cielo azul",
    "El clásico celeste que enamora a grandes y chicos",
    "clasicos",
  ),
  product("Crema maracuyá", "Fresca y perfumada", "clasicos"),
  product("Crema Oreo", "Crema americana con galletitas Oreo", "clasicos"),
  product("Crema rusa", "Con caramelo y nueces", "clasicos"),
  product("Crema tramontana", "Con dulce de leche y galletitas", "clasicos"),
  product(
    "Crema vainilla",
    "La receta de siempre. También sin azúcar",
    "clasicos",
  ),
  product("Crème brûlée", "Crema tostada al estilo francés", "clasicos"),
  product(
    "Dulce de leche",
    "El rey de la casa. También sin azúcar y sin gluten",
    "clasicos",
  ),
  product("Dulce de leche con Nutella", "Dos placeres en uno", "clasicos"),
  product(
    "Dulce de leche granizado",
    "Con chispas de chocolate. También sin azúcar",
    "clasicos",
  ),
  product("Dulce de leche Oreo", "Con galletitas Oreo", "clasicos"),
  product(
    "Dulce de leche tentación",
    "Con más dulce de leche",
    "clasicos",
    "assets/productos/dulce-de-leche-tentacion.jpg",
  ),
  product(
    "Frambuesa granizada",
    "Con trozos de chocolate Cadbury",
    "clasicos",
  ),
  product("Frutilla a la panna", "Frutilla con crema de leche", "clasicos"),
  product(
    "Frutilla al agua",
    "Fresca y liviana. También sin azúcar y sin gluten",
    "clasicos",
  ),
  product(
    "Frutos rojos",
    "Mezcla de berries. También sin azúcar",
    "clasicos",
  ),
  product("Lemon pie", "Como la torta, pero helado", "clasicos"),
  product("Mango al agua", "A base de fruta. Vegano", "clasicos"),
  product("Mantecol", "El postre uruguayo hecho helado", "clasicos"),
  product(
    "Menta granizada",
    "Con chispas de chocolate. También con mini Oreo",
    "clasicos",
    "assets/productos/menta-granizada.jpg",
  ),
  product(
    "Menta granizada con galletitas mini Oreo",
    "Con galletitas trituradas",
    "clasicos",
  ),
  product("Nutella", "Puro avellanas y cacao", "clasicos"),
  product(
    "Piccottino",
    "Crema americana con Nutella y frambuesas bañadas en chocolate",
    "clasicos",
  ),
  product("Pistacho", "Auténtico pistacho tostado", "clasicos"),
  product("Raffaello", "Chocolate blanco con coco", "clasicos"),
  product("Rubí amarena", "Chocolate con amarena y guindas", "clasicos"),
  product("Sambayón", "El clásico al vino", "clasicos"),
  product("Sambayón con cerezas", "Con cerezas al marrasquino", "clasicos"),
  product("Sambayón italiano", "Con whisky y bizcochuelo", "clasicos"),
  product(
    "Yogurt griego amarena",
    "Con guindas italianas en almíbar",
    "clasicos",
  ),

  product("Café sin azúcar", "Intenso como un espresso", "sin-azucar"),
  product(
    "Chocolate sin azúcar",
    "Intenso y cremoso, sin azúcar",
    "sin-azucar",
  ),
  product(
    "Crema granizada sin azúcar",
    "Con chispas de chocolate",
    "sin-azucar",
  ),
  product("Crema vainilla sin azúcar", "Suave y clásica", "sin-azucar"),
  product(
    "Dulce de leche granizado sin azúcar",
    "Con chispas de chocolate",
    "sin-azucar",
  ),
  product(
    "Dulce de leche sin azúcar",
    "El clásico en versión liviana",
    "sin-azucar",
  ),
  product("Frutilla al agua sin azúcar", "Fresca y liviana", "sin-azucar"),
  product("Frutos rojos sin azúcar", "Mezcla de berries", "sin-azucar"),
  product("Limón al agua sin azúcar", "El más refrescante", "sin-azucar"),
  product(
    "Maracuyá al agua sin azúcar",
    "Tropical y perfumado",
    "sin-azucar",
  ),
  product(
    "Sambayón al jerez sin azúcar",
    "Con un toque de jerez",
    "sin-azucar",
  ),
  product(
    "Yogurt con nueces",
    "Cremoso y natural. Sin azúcar agregada",
    "sin-azucar",
  ),

  product(
    "Frutilla al agua con azúcar",
    "Fresca y liviana, sin lactosa",
    "sin-lactosa",
  ),

  product(
    "Chocolate con azúcar y sin gluten",
    "Apto celíacos",
    "sin-gluten",
  ),
  product(
    "Dulce de leche con azúcar y sin gluten",
    "Apto celíacos",
    "sin-gluten",
  ),
  product(
    "Frutilla al agua con azúcar y sin gluten",
    "Apto celíacos y vegano",
    "sin-gluten",
  ),

  product(
    "Paletta vegana de chocolate y nueces",
    "Con baño de chocolate",
    "barritas-veganas",
  ),
  product(
    "Paletta vegana de frutilla y arándanos",
    "Con baño de chocolate",
    "barritas-veganas",
  ),
  product(
    "Paletta vegana de menta",
    "Con baño de chocolate",
    "barritas-veganas",
  ),

  product(
    "Alfajor brownie",
    "Relleno con helado de crema o dulce de leche",
    "postres-con-azucar",
  ),
  product(
    "Almendrado",
    "Crema doble con almendras caramelizadas",
    "postres-con-azucar",
  ),
  product(
    "Bombón helado",
    "Menta o almendras bañado en chocolate",
    "postres-con-azucar",
  ),
  product(
    "Bombón suizo",
    "Chocolate con pasas y dulce de leche repostero, bañado en chocolate negro",
    "postres-con-azucar",
  ),
  product(
    "Cannoli pistacho",
    "Cannoli italiano relleno de helado de pistacho",
    "postres-con-azucar",
  ),
  product(
    "Cannoli sambayón",
    "Cannoli italiano relleno de helado de sambayón",
    "postres-con-azucar",
  ),
  product(
    "Cassata clásica",
    "Crema, chocolate y frutilla con centro de chantilly, cerezas y nueces",
    "postres-con-azucar",
  ),
  product(
    "Omelette surprise",
    "Bizcochuelo, helado de crema vainilla y merengue italiano",
    "postres-con-azucar",
  ),
  product("Paletta carita", "", "postres-con-azucar"),
  product(
    "Spumoni",
    "Delicado mousse de chocolate helado",
    "postres-con-azucar",
  ),
  product(
    "Torta helada clásica",
    "Bizcochuelo y helado en capas de crema, chocolate, frutilla y sambayón, con chantilly y cerezas",
    "postres-con-azucar",
  ),
  product(
    "Torta praliné",
    "Dulce de leche, crema rusa y sambayón, con pasas, chantilly y almendras",
    "postres-con-azucar",
  ),

  product(
    "Alfajor sin azúcar",
    "De dulce de leche sin azúcar. Aprobado por ADU",
    "postres-sin-azucar",
  ),
  product(
    "Cassata individual sin azúcar",
    "Café, dulce de leche y sambayón sin azúcar, con baño de chocolate negro sin azúcar. Aprobada por ADU",
    "postres-sin-azucar",
  ),
  product(
    "Paleta sin azúcar",
    "Bañada en chocolate sin azúcar. Aprobada por ADU",
    "postres-sin-azucar",
  ),
  product(
    "Sándwich sin azúcar",
    "Sándwiches artesanales sin azúcar. Aprobados por ADU",
    "postres-sin-azucar",
  ),
  product(
    "Torta sin azúcar",
    "Crema, chocolate, frutilla y sambayón sin azúcar. Aprobada por ADU",
    "postres-sin-azucar",
  ),

  product("Cucurucho sin gluten", "Apto celíacos", "cucuruchos"),
  product(
    "Cucuruchos Marvi x10",
    "Pack de 10 cucuruchos artesanales",
    "cucuruchos",
  ),
];
