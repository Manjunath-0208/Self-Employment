import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory data store for the demo (since Firebase was declined)
  let products = [
    {
      id: "1",
      name: "Handwoven Jute Bag",
      description: "A sustainable and stylish handwoven bag made from natural jute fibers.",
      price: 2100,
      category: "Textiles",
      artisanId: "artisan_1",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400",
      variations: [
        { id: "v1", type: "Color", value: "Natural Jute", stock: 15, priceAdjustment: 0 },
        { id: "v2", type: "Color", value: "Indigo Blue", stock: 8, priceAdjustment: 250 },
        { id: "v3", type: "Color", value: "Madder Red", stock: 5, priceAdjustment: 300 }
      ]
    },
    {
      id: "2",
      name: "Ceramic Tea Set",
      description: "Beautifully handcrafted ceramic set includes a teapot and four cups.",
      price: 3500,
      category: "Pottery",
      artisanId: "artisan_1",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1576020482031-f2884a4f89fb?auto=format&fit=crop&q=80&w=400",
      variations: [
        { id: "v4", type: "Set Size", value: "2 Cups", stock: 10, priceAdjustment: -1000 },
        { id: "v5", type: "Set Size", value: "4 Cups", stock: 12, priceAdjustment: 0 },
        { id: "v6", type: "Set Size", value: "6 Cups", stock: 5, priceAdjustment: 1200 }
      ]
    },
    {
      id: "3",
      name: "Hand-carved Wooden Elephant",
      description: "Intricately detailed wooden elephant, carved from high-quality rosewood.",
      price: 2800,
      category: "Decor",
      artisanId: "artisan_2",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "4",
      name: "Block Printed Saree",
      description: "Elegant cotton saree with traditional block print designs from Jaipur.",
      price: 4500,
      category: "Textiles",
      artisanId: "artisan_2",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1610030469668-93510ec20164?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "5",
      name: "Blue Pottery Vase",
      description: "Classic Jaipur blue pottery vase with floral motifs, perfect for home decor.",
      price: 1850,
      category: "Pottery",
      artisanId: "artisan_1",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1612196808214-b9e1d614e380?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "6",
      name: "Brass Wall Antique",
      description: "Exquisite brass wall hanging featuring traditional Indian patterns.",
      price: 3200,
      category: "Decor",
      artisanId: "artisan_2",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "7",
      name: "Macrame Key Chain",
      description: "Hand-knotted macrame key chain with boho aesthetic, made from recycled cotton.",
      price: 450,
      category: "Decor",
      artisanId: "artisan_1",
      rating: 4.5,
      image: "https://images.unsplash.com/photo-1619134769032-e9d758303441?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "8",
      name: "Banana Fiber Tote Bag",
      description: "Eco-friendly and durable tote bag expertly woven from natural banana plant fibers.",
      price: 1550,
      category: "Textiles",
      artisanId: "artisan_2",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "9",
      name: "Tribal Beaded Bracelet",
      description: "Handcrafted bracelet featuring intricate beadwork inspired by traditional tribal patterns.",
      price: 850,
      category: "Jewelry",
      artisanId: "artisan_1",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "10",
      name: "Leather Charm Key Chain",
      description: "Fine leather key chain with hand-stamped initials and a brass ring.",
      price: 650,
      category: "Accessories",
      artisanId: "artisan_2",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "11",
      name: "Hand-painted Banana Fiber Pouch",
      description: "Small zip pouch made from woven banana fiber, featuring hand-painted floral art.",
      price: 950,
      category: "Accessories",
      artisanId: "artisan_1",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "12",
      name: "Silver Filigree Bracelet",
      description: "Delicate silver bracelet made with traditional filigree techniques.",
      price: 2450,
      category: "Jewelry",
      artisanId: "artisan_2",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "13",
      name: "Teak Wood Key Chain",
      description: "Simple and elegant key chain hand-turned from reclaimed teak wood.",
      price: 199,
      category: "Accessories",
      artisanId: "artisan_1",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1582142823910-eeacbac4040a?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "14",
      name: "Cotton Beaded Neck Chain",
      description: "Lightweight neck chain with colorful handmade clay beads.",
      price: 350,
      category: "Jewelry",
      artisanId: "artisan_2",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "15",
      name: "Braided Jute Key Ring",
      description: "Sturdy and eco-friendly key ring hand-braided by village artisans.",
      price: 150,
      category: "Accessories",
      artisanId: "artisan_1",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?auto=format&fit=crop&q=80&w=400"
    }
  ];

  let orders = [];
  let carts = {}; // userId -> items
  let reviews = [
    { id: "r1", productId: "1", userId: "customer_1", userName: "Anjali Sharma", rating: 5, comment: "Absolutely stunning quality. You can feel the craftsmanship in every stitch.", createdAt: new Date() },
    { id: "r2", productId: "1", userId: "customer_2", userName: "Vivek G.", rating: 4, comment: "Very nice bag, although a bit smaller than I expected.", createdAt: new Date() }
  ];

  let artisans = [
    { id: "artisan_1", name: "Rajesh Kumar", type: "Master Potter & Weaver", bio: "With over 20 years of experience, Rajesh brings traditional techniques to modern sustainable lifestyles.", location: "Jaipur, Rajasthan", followers: 128 },
    { id: "artisan_2", name: "Suman Devi", type: "Textile & Wood Artist", bio: "Suman specializes in natural dyes and rosewood carving, preserving her family's centuries-old heritage.", location: "Lucknow, Uttar Pradesh", followers: 85 }
  ];

  // API Routes
  app.get("/api/artisans", (req, res) => {
    res.json(artisans);
  });

  app.get("/api/artisans/:id", (req, res) => {
    const artisan = artisans.find(a => a.id === req.params.id);
    if (artisan) res.json(artisan);
    else res.status(404).send("Artisan not found");
  });

  app.post("/api/artisans/:id/follow", (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'follow' or 'unfollow'
    const artisan = artisans.find(a => a.id === id);
    if (artisan) {
      if (action === 'follow') artisan.followers += 1;
      else if (action === 'unfollow' && artisan.followers > 0) artisan.followers -= 1;
      res.json(artisan);
    } else {
      res.status(404).send("Artisan not found");
    }
  });

  app.get("/api/products", (req, res) => {
    // Calculate sales per product ID
    const salesCount: Record<string, number> = {};
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        salesCount[item.id] = (salesCount[item.id] || 0) + item.quantity;
      });
    });

    // Mark products as best selling if they have more than 2 sales (threshold for demo)
    const productsWithSales = products.map(p => ({
      ...p,
      bestSelling: (salesCount[p.id] || 0) > 2
    }));

    res.json(productsWithSales);
  });

  app.get("/api/reviews/:productId", (req, res) => {
    res.json(reviews.filter(r => r.productId === req.params.productId));
  });

  app.post("/api/reviews", (req, res) => {
    const review = { ...req.body, id: `REV-${Date.now()}`, createdAt: new Date() };
    reviews.push(review);
    res.status(201).json(review);
  });

  app.post("/api/products", (req, res) => {
    const newProduct = { ...req.body, id: Date.now().toString() };
    products.push(newProduct);
    res.status(201).json(newProduct);
  });

  app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...req.body };
      res.json(products[index]);
    } else {
      res.status(404).send("Product not found");
    }
  });

  app.delete("/api/products/:id", (req, res) => {
    products = products.filter(p => p.id !== req.params.id);
    res.status(204).send();
  });

  app.post("/api/orders", (req, res) => {
    const order = { ...req.body, id: `ORD-${Date.now()}`, status: "Placed", createdAt: new Date() };
    orders.push(order);
    res.status(201).json(order);
  });

  app.get("/api/orders/:userId", (req, res) => {
    res.json(orders.filter(o => o.userId === req.params.userId));
  });

  app.get("/api/artisan/orders/:artisanId", (req, res) => {
    const artisanId = req.params.artisanId;
    const artisanOrders = orders.filter(order => 
      order.items.some((item: any) => item.artisanId === artisanId)
    ).map(order => ({
      ...order,
      items: order.items.filter((item: any) => item.artisanId === artisanId)
    }));
    res.json(artisanOrders);
  });

  app.patch("/api/orders/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = orders.find(o => o.id === id);
    if (order) {
      order.status = status;
      res.json(order);
    } else {
      res.status(404).send("Order not found");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Hasta-Kala Server running at http://localhost:${PORT}`);
  });
}

startServer();
