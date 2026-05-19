/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingBag, LayoutDashboard, Search, ShoppingCart, User as UserIcon, LogOut, ChevronRight, MessageSquare, Star, Sparkles, Plus, Trash2, Heart, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Product, Role, CartItem, Order, Review, Variation } from './types';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Components (defined within the same file for simplicity in this demo, usually should be separated)
const Navbar = ({ user, onLogout, onPageChange, cartCount }: { user: User | null, onLogout: () => void, onPageChange: (page: string) => void, cartCount: number }) => (
  <nav className="fixed top-0 left-0 right-0 bg-artisan-bg/80 backdrop-blur-md z-50 px-6 py-4 border-b border-black/5">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onPageChange('home')}>
        <div className="w-10 h-10 bg-artisan-accent rounded-full flex items-center justify-center text-white">
          <ShoppingBag size={20} />
        </div>
        <span className="font-serif text-xl font-bold tracking-tight">Hasta-Kala</span>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <button onClick={() => onPageChange('orders')} className="p-2 hover:bg-black/5 rounded-full transition-colors flex items-center gap-2">
              <Package size={22} />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest text-black/50">Orders</span>
            </button>
            {user.role === 'Customer' && (
              <button onClick={() => onPageChange('cart')} className="relative p-2 hover:bg-black/5 rounded-full transition-colors">
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-artisan-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-artisan-bg">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            <button onClick={() => onPageChange('profile')} className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <UserIcon size={22} />
            </button>
            <button onClick={onLogout} className="p-2 hover:bg-black/5 rounded-full transition-colors text-red-500">
              <LogOut size={22} />
            </button>
          </>
        ) : (
          <button className="artisan-button" onClick={() => onPageChange('login')}>Sign In</button>
        )}
      </div>
    </div>
  </nav>
);

const ChatOverlay = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed bottom-6 right-6 z-[100]">
    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="artisan-card w-80 h-96 flex flex-col">
      <div className="bg-artisan-accent p-4 text-white flex justify-between items-center">
        <div>
          <h4 className="font-bold">Contact Artisan</h4>
          <p className="text-[10px] opacity-70 italic">Rajesh Kumar • Potter</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-artisan-bg/30">
        <div className="bg-white p-3 rounded-2xl shadow-sm text-sm self-start max-w-[80%]">
          Hello! I really like your jute bags. Do you do custom colors?
        </div>
        <div className="bg-artisan-accent text-white p-3 rounded-2xl shadow-sm text-sm self-end max-w-[80%] ml-auto">
          Namaste! Yes, I can weave them in blue or deep red as well. Which one would you prefer?
        </div>
      </div>
      <div className="p-4 border-t border-black/5 bg-white">
        <div className="flex gap-2">
          <input type="text" placeholder="Type a message..." className="flex-1 text-sm bg-transparent outline-none" />
          <button className="text-artisan-accent">
            <MessageSquare size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (e) {
      console.error("Failed to fetch products", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAISearch = async (overrideQuery?: string) => {
    const query = overrideQuery || searchQuery;
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }

    setIsSearching(true);
    try {
      const productContext = products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category
      }));

      const prompt = `You are a helpful shopping assistant for "Hasta-Kala", a handicraft shop. 
      The user is searching for: "${query}"
      
      Here are the available products in the shop:
      ${JSON.stringify(productContext)}
      
      Analyze the user's search intent. Which products best match their request? 
      
      CRITICAL INSTRUCTIONS:
      1. Use semantic expansion: If a user searches for specific terms like "key chains", explicitly include related items such as "key rings", "charms", or small "pouches" that serve a similar decorative or functional purpose.
      2. Understand material and craft: If they search for materials like "banana fiber" or "jute", surface all relevant items using those materials.
      3. Focus on intent: If the user is looking for accessories, show all small handcrafted accessories that fit the vibe, even if the keywords don't match exactly.
      
      Return ONLY a JSON array of the product IDs that match the search. 
      Example: ["1", "3"]
      If nothing matches, return an empty array [].`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      const text = response.text || "";
      
      // Extract array from potential markdown blocks
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const matchedIds = JSON.parse(jsonStr);

      if (Array.isArray(matchedIds)) {
        const matched = products.filter(p => matchedIds.includes(p.id));
        setFilteredProducts(matched);
      }
    } catch (e) {
      console.error("AI Search failed", e);
      // Fallback to simple keyword search if AI fails
      const keyword = searchQuery.toLowerCase();
      setFilteredProducts(products.filter(p => 
        p.name.toLowerCase().includes(keyword) || 
        p.description.toLowerCase().includes(keyword) ||
        p.category.toLowerCase().includes(keyword)
      ));
    } finally {
      setIsSearching(false);
    }
  };

  const login = (role: Role) => {
    setUser({
      id: role === 'Artisan' ? 'artisan_1' : 'customer_1',
      name: role === 'Artisan' ? 'Rajesh Kumar' : 'Anjali Sharma',
      email: role === 'Artisan' ? 'rajesh@artisan.com' : 'anjali@example.com',
      role: role,
      followedArtisans: []
    });
    setCurrentPage('home');
  };

  const logout = () => {
    setUser(null);
    setCurrentPage('home');
  };

  const toggleFollowArtisan = async (artisanId: string) => {
    if (!user || user.role !== 'Customer') return;
    
    const isFollowing = user.followedArtisans?.includes(artisanId);
    const action = isFollowing ? 'unfollow' : 'follow';
    
    try {
      await fetch(`/api/artisans/${artisanId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      setUser(prev => {
        if (!prev) return null;
        const currentFollowed = prev.followedArtisans || [];
        return {
          ...prev,
          followedArtisans: isFollowing 
            ? currentFollowed.filter(id => id !== artisanId)
            : [...currentFollowed, artisanId]
        };
      });
    } catch (e) {
      console.error("Failed to toggle follow", e);
    }
  };

  const addToCart = (product: Product, variationId?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedVariationId === variationId);
      if (existing) {
        return prev.map(item => (item.id === product.id && item.selectedVariationId === variationId) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, selectedVariationId: variationId }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const placeOrder = async () => {
    if (!user) return;
    const total = cart.reduce((acc, item) => {
      const variation = item.variations?.find(v => v.id === item.selectedVariationId);
      const price = item.price + (variation?.priceAdjustment || 0);
      return acc + (price * item.quantity);
    }, 0);

    const orderData = {
      userId: user.id,
      items: cart,
      total: total
    };
    
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        setCart([]);
        setCurrentPage('orders');
      }
    } catch (e) {
      console.error("Order failed", e);
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-24 px-4 sm:px-6">
      <Navbar 
        user={user} 
        onLogout={logout} 
        onPageChange={setCurrentPage} 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
      />

      {user?.role === 'Customer' && (
        <button 
          onClick={() => setShowChat(!showChat)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-artisan-accent text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:scale-110 transition-transform"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {showChat && <ChatOverlay onClose={() => setShowChat(false)} />}

      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {currentPage === 'login' && !user && (
            <motion.div 
              key="login-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-20 max-w-md mx-auto"
            >
              <div className="artisan-card p-10 text-center">
                <ShoppingBag size={48} className="mx-auto text-artisan-accent mb-6" />
                <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                <p className="text-black/50 mb-10 text-sm">Please choose your role to enter the marketplace.</p>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => login('Customer')}
                    className="artisan-button w-full py-4 text-lg"
                  >
                    Login as Customer
                  </button>
                  <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-black/5 flex-1" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/20">or</span>
                    <div className="h-px bg-black/5 flex-1" />
                  </div>
                  <button 
                    onClick={() => login('Artisan')}
                    className="w-full py-4 rounded-full border-2 border-artisan-accent text-artisan-accent font-bold hover:bg-artisan-accent hover:text-white transition-all"
                  >
                    Login as Artisan
                  </button>
                </div>
                
                <button 
                  onClick={() => setCurrentPage('home')}
                  className="mt-8 text-xs font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {!user && currentPage === 'home' && (
            <motion.div 
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-12 text-center"
            >
              <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
                Handcrafted with Soul, <br />
                <span className="italic text-artisan-accent">Delivered with Care.</span>
              </h1>
              <p className="text-lg text-black/60 max-w-2xl mx-auto mb-10">
                Support local artisans and bring unique, sustainable crafts into your home. Join our community today.
              </p>
              <div className="flex justify-center gap-4">
                <button className="artisan-button text-lg px-8 py-4" onClick={() => login('Customer')}>Shop Now</button>
                <button className="border-2 border-artisan-accent text-artisan-accent rounded-full px-8 py-4 font-medium hover:bg-artisan-accent hover:text-white transition-all" onClick={() => login('Artisan')}>Sell Crafts</button>
              </div>
            </motion.div>
          )}

          {currentPage === 'home' && products.length > 0 && (
            <motion.div 
              key="marketplace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-16"
            >
              <div className="mb-12 max-w-2xl mx-auto">
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Describe what you're looking for... (e.g. 'something eco-friendly for my desk')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                    className="artisan-input w-full pl-12 pr-32 py-5 shadow-lg group-focus-within:ring-artisan-accent/30 transition-all border-none bg-white text-lg"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-artisan-accent transition-colors" size={24} />
                  <button 
                    onClick={handleAISearch}
                    disabled={isSearching}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-artisan-ink text-white rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {isSearching ? <Sparkles size={18} className="animate-pulse" /> : <Sparkles size={18} />}
                    <span>{isSearching ? 'Analyzing...' : 'AI Search'}</span>
                  </button>
                </div>
                
                <div className="mt-3 flex gap-2 flex-wrap px-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-black/30 pt-1">Try:</span>
                  {['key chains', 'banana fiber bags', 'bracelets'].map(term => (
                    <button 
                      key={term}
                      onClick={() => { setSearchQuery(term); handleAISearch(term); }}
                      className="text-[10px] font-bold text-black/50 hover:text-artisan-accent transition-colors bg-black/5 px-2.5 py-1 rounded-full border border-black/5"
                    >
                      "{term}"
                    </button>
                  ))}
                </div>

                {filteredProducts.length !== products.length && (
                  <div className="mt-4 flex justify-between items-center px-2">
                    <p className="text-sm text-black/50">Found {filteredProducts.length} items matching your intent</p>
                    <button 
                      onClick={() => { setSearchQuery(''); setFilteredProducts(products); }}
                      className="text-xs font-bold uppercase tracking-widest text-artisan-accent hover:underline"
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="col-span-full flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold">{searchQuery ? 'Search Results' : 'Featured Crafts'}</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setFilteredProducts(products)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filteredProducts.length === products.length ? 'bg-artisan-accent text-white' : 'bg-artisan-accent/10 text-artisan-accent hover:bg-artisan-accent/20'}`}
                    >
                      All
                    </button>
                    {Array.from(new Set(products.map(p => p.category))).map(cat => (
                      <button 
                         key={cat}
                         onClick={() => setFilteredProducts(products.filter(p => p.category === cat))}
                         className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filteredProducts.length !== products.length && filteredProducts.every(p => p.category === cat) ? 'bg-artisan-accent text-white' : 'bg-artisan-accent/10 text-artisan-accent hover:bg-artisan-accent/20'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                {filteredProducts.map((product) => (
                  <div key={product.id} className="artisan-card group cursor-pointer" onClick={() => setCurrentPage(`product-${product.id}`)}>
                    <div className="aspect-[4/5] overflow-hidden relative">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <button className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white transition-colors shadow-sm">
                        <Heart size={20} className="text-artisan-accent" />
                      </button>
                      {product.bestSelling && (
                        <span className="absolute top-4 left-4 bg-orange-500 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full">Best Seller</span>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold">{product.name}</h3>
                        <span className="text-lg font-medium text-artisan-accent">₹{product.price}</span>
                      </div>
                      <p className="text-black/50 text-sm mb-4 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star size={16} fill="currentColor" />
                          <span className="text-sm font-bold text-black">{product.rating}</span>
                        </div>
                        <button 
                          className="p-2 bg-artisan-accent text-white rounded-full hover:bg-artisan-accent-light transition-colors"
                          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        >
                          <ShoppingCart size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentPage === 'cart' && (
             <motion.div key="cart-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mt-8 max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold mb-8">Your Cart</h2>
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingCart size={64} className="mx-auto mb-6 text-black/10" />
                    <p className="text-xl text-black/40 mb-8">Your cart is empty.</p>
                    <button className="artisan-button" onClick={() => setCurrentPage('home')}>Continue Shopping</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item, idx) => {
                      const variation = item.variations?.find(v => v.id === item.selectedVariationId);
                      const adjustedPrice = item.price + (variation?.priceAdjustment || 0);
                      return (
                        <div key={`${item.id}-${idx}`} className="artisan-card p-4 flex gap-4 items-center">
                          <img src={item.image} className="w-24 h-24 rounded-2xl object-cover" />
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{item.name}</h3>
                            {variation && (
                              <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest mt-1">
                                {variation.type}: {variation.value}
                              </p>
                            )}
                            <p className="text-artisan-accent font-medium mt-1">₹{adjustedPrice} x {item.quantity}</p>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      );
                    })}
                    <div className="pt-6 border-t border-black/5">
                      <div className="flex justify-between text-2xl font-bold mb-8">
                        <span>Total</span>
                        <span>₹{cart.reduce((acc, item) => {
                          const variation = item.variations?.find(v => v.id === item.selectedVariationId);
                          return acc + (item.price + (variation?.priceAdjustment || 0)) * item.quantity;
                        }, 0).toFixed(2)}</span>
                      </div>
                      <button className="artisan-button w-full py-4 text-xl" onClick={placeOrder}>Checkout</button>
                    </div>
                  </div>
                )}
             </motion.div>
          )}

          {currentPage === 'dashboard' && user?.role === 'Artisan' && (
            <ArtisanDashboard products={products} setProducts={setProducts} />
          )}

          {currentPage.startsWith('product-') && (
            <ProductDetail 
              productId={currentPage.split('-')[1]} 
              products={products} 
              onAddToCart={addToCart} 
              onBack={() => setCurrentPage('home')}
              user={user}
              onToggleFollow={toggleFollowArtisan}
            />
          )}

          {currentPage === 'profile' && user && (
            <ProfilePage user={user} onPageChange={setCurrentPage} onToggleFollow={toggleFollowArtisan} />
          )}

          {currentPage === 'orders' && user && (
            <OrderHistory user={user} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Product Detail Component
const ProductDetail = ({ productId, products, onAddToCart, onBack, user, onToggleFollow }: { productId: string, products: Product[], onAddToCart: (p: Product, varId?: string) => void, onBack: () => void, user: User | null, onToggleFollow: (id: string) => void }) => {
  const product = products.find(p => p.id === productId);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedVariationId, setSelectedVariationId] = useState<string | undefined>(product?.variations?.[0]?.id);
  const [artisan, setArtisan] = useState<any>(null);
  
  useEffect(() => {
    if (productId && product) {
      // Fetch reviews
      fetch(`/api/reviews/${productId}`)
        .then(res => res.json())
        .then(setReviews)
        .catch(console.error);

      // Fetch artisan details
      fetch(`/api/artisans/${product.artisanId}`)
        .then(res => res.json())
        .then(setArtisan)
        .catch(console.error);
    }
  }, [productId, product]);

  const selectedVariation = product?.variations?.find(v => v.id === selectedVariationId);
  const finalPrice = product ? product.price + (selectedVariation?.priceAdjustment || 0) : 0;
  const isFollowing = user?.followedArtisans?.includes(product?.artisanId || '');

  const submitReview = async () => {
    if (!user) return alert("Please sign in to leave a review.");
    if (!newReview.comment) return alert("Please enter a comment.");
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          userId: user.id,
          userName: user.name,
          rating: newReview.rating,
          comment: newReview.comment
        })
      });
      if (res.ok) {
        const added = await res.json();
        setReviews(prev => [added, ...prev]);
        setNewReview({ rating: 5, comment: '' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (!product) return (
    <div className="text-center py-20 artisan-card mt-8">
      <p className="text-black/40 italic">Product not found.</p>
      <button onClick={onBack} className="mt-4 artisan-button">Back to Shop</button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
      <button onClick={onBack} className="flex items-center gap-2 text-black/50 hover:text-black mb-8 transition-colors group">
        <ChevronRight className="rotate-180" size={20} />
        <span className="text-xs font-bold uppercase tracking-widest">Back to Shop</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="artisan-card aspect-[4/5] overflow-hidden">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>
        
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-artisan-accent/10 text-artisan-accent text-[10px] uppercase font-bold tracking-widest rounded-full">
              {product.category}
            </span>
            {product.bestSelling && (
              <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] uppercase font-bold tracking-widest rounded-full">
                Best Selling
              </span>
            )}
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight leading-none">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl font-serif text-artisan-accent">₹{finalPrice.toFixed(2)}</span>
            <div className="flex items-center gap-1 text-yellow-500 border-l border-black/10 pl-4">
              <Star size={18} fill="currentColor" />
              <span className="font-bold text-black">{product.rating}</span>
            </div>
          </div>

          {product.variations && product.variations.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-3">Available Variations</h4>
              <div className="flex flex-wrap gap-2">
                {product.variations.map(v => (
                  <button 
                    key={v.id}
                    onClick={() => setSelectedVariationId(v.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedVariationId === v.id ? 'border-artisan-accent bg-artisan-accent/5 text-artisan-accent' : 'border-black/5 hover:border-black/10 text-black/60'}`}
                  >
                    <span className="block">{v.type}: {v.value}</span>
                    <div className="flex items-center justify-between gap-4 mt-1">
                      <span className="text-[10px] opacity-70 font-bold">{v.stock} in stock</span>
                      {v.priceAdjustment !== 0 && (
                        <span className="text-[10px] font-bold">
                          {v.priceAdjustment > 0 ? '+' : ''}₹{Math.abs(v.priceAdjustment)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="prose prose-stone mb-10">
            <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-4">Story Behind the Craft</h4>
            <p className="text-lg text-black/70 leading-relaxed font-serif italic">
              "{product.description}"
            </p>
          </div>

          <div className="artisan-card p-6 bg-white/50 border-black/5 mb-10 overflow-hidden relative">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-full bg-artisan-accent text-white flex items-center justify-center text-xl font-serif shadow-lg">
                {artisan?.name.charAt(0) || <UserIcon size={24} />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-0.5">Handcrafted By</p>
                <h4 className="font-bold text-lg leading-tight">{artisan?.name || `Artisan ${product.artisanId.split('_')[1]}`}</h4>
                <p className="text-[10px] text-black/60 flex items-center gap-1 mt-1 font-medium">
                  <Star size={10} fill="#f59e0b" className="text-amber-500" />
                  4.9 Artist Rating • {artisan?.followers || 0} Followers
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => onToggleFollow(product.artisanId)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    isFollowing 
                      ? 'bg-black/5 text-black/40 border border-black/5' 
                      : 'bg-artisan-accent text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button className="p-2 hover:bg-black/5 rounded-full transition-colors text-artisan-accent self-end">
                  <MessageSquare size={22} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <button 
              className="artisan-button w-full py-5 text-xl flex items-center justify-center gap-3"
              onClick={() => onAddToCart(product, selectedVariationId)}
            >
              <ShoppingCart size={24} /> Add to Cart
            </button>
            <button className="w-full py-4 rounded-full border-2 border-artisan-accent text-artisan-accent font-bold hover:bg-artisan-accent hover:text-white transition-all flex items-center justify-center gap-2">
              <Heart size={20} /> Add to Wishlist
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-20 max-w-4xl">
        <h3 className="text-3xl font-bold mb-10">Artisan Reviews</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Review Form */}
          <div className="md:col-span-1">
            <div className="artisan-card p-6 bg-white sticky top-24">
              <h4 className="font-bold mb-4">Share your thoughts</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 block mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star} 
                        onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                        className={`${newReview.rating >= star ? 'text-yellow-500' : 'text-black/10'} transition-colors`}
                      >
                        <Star size={20} fill={newReview.rating >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 block mb-2">Comment</label>
                  <textarea 
                    value={newReview.comment}
                    onChange={e => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="What did you love about this craft?"
                    className="artisan-input w-full h-24 text-sm resize-none"
                  />
                </div>
                <button 
                  onClick={submitReview}
                  disabled={submitting}
                  className="artisan-button w-full py-3 text-sm"
                >
                  {submitting ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </div>
          </div>

          {/* Review List */}
          <div className="md:col-span-2 space-y-8">
            {reviews.length === 0 ? (
              <p className="text-black/40 italic">No reviews yet. Be the first to share your experience!</p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="border-b border-black/5 pb-8">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h5 className="font-bold">{review.userName}</h5>
                      <div className="flex gap-1 text-yellow-500 mt-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} size={12} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-black/40 uppercase tracking-widest">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-black/70 leading-relaxed italic">
                    "{review.comment}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Profile Page Component
const ProfilePage = ({ user, onPageChange, onToggleFollow }: { user: User, onPageChange: (page: string) => void, onToggleFollow: (id: string) => void }) => {
  const [followedArtisans, setFollowedArtisans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user.followedArtisans && user.followedArtisans.length > 0) {
      setLoading(true);
      Promise.all(user.followedArtisans.map(id => fetch(`/api/artisans/${id}`).then(res => res.json())))
        .then(setFollowedArtisans)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setFollowedArtisans([]);
    }
  }, [user.followedArtisans]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="mt-8 max-w-2xl mx-auto"
    >
      <div className="artisan-card p-10 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-artisan-accent/5 rounded-bl-full -mr-10 -mt-10" />
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 bg-artisan-accent text-white rounded-full flex items-center justify-center text-3xl font-serif mb-4 shadow-xl">
            {user.name.charAt(0)}
          </div>
          <h2 className="text-3xl font-bold">{user.name}</h2>
          <p className="text-black/40 font-medium">{user.email}</p>
          <span className="mt-3 px-4 py-1 bg-artisan-accent/10 text-artisan-accent text-[10px] uppercase font-bold tracking-[0.2em] rounded-full">
            {user.role} Account
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {user.role === 'Customer' ? (
            <>
              <button 
                onClick={() => onPageChange('orders')}
                className="artisan-card p-6 flex flex-col items-center gap-3 hover:bg-artisan-accent/5 transition-colors border-black/5"
              >
                <Package className="text-artisan-accent" size={28} />
                <span className="font-bold text-sm">Order History</span>
                <p className="text-[10px] text-black/40 uppercase tracking-widest text-center">View your past craft purchases</p>
              </button>
              <button 
                onClick={() => onPageChange('home')}
                className="artisan-card p-6 flex flex-col items-center gap-3 hover:bg-artisan-accent/5 transition-colors border-black/5"
              >
                <ShoppingBag className="text-artisan-accent" size={28} />
                <span className="font-bold text-sm">Marketplace</span>
                <p className="text-[10px] text-black/40 uppercase tracking-widest text-center">Explore more handcrafted items</p>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => onPageChange('dashboard')}
                className="artisan-card p-6 flex flex-col items-center gap-3 hover:bg-artisan-accent/5 transition-colors border-black/5"
              >
                <LayoutDashboard className="text-artisan-accent" size={28} />
                <span className="font-bold text-sm">Manage Products</span>
                <p className="text-[10px] text-black/40 uppercase tracking-widest text-center">Edit inventory & list new crafts</p>
              </button>
              <button 
                onClick={() => onPageChange('orders')}
                className="artisan-card p-6 flex flex-col items-center gap-3 hover:bg-artisan-accent/5 transition-colors border-black/5"
              >
                <Star className="text-artisan-accent" size={28} />
                <span className="font-bold text-sm">Sales History</span>
                <p className="text-[10px] text-black/40 uppercase tracking-widest text-center">Track your customer orders</p>
              </button>
            </>
          )}
        </div>

        {user.role === 'Customer' && (
          <div className="mt-10 pt-10 border-t border-black/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-black/30 mb-6 px-2">Artisans You Follow</h4>
            {loading ? (
              <p className="text-center italic text-black/30 py-4">Loading artisans...</p>
            ) : followedArtisans.length === 0 ? (
              <div className="text-center py-6 bg-black/5 rounded-3xl">
                <p className="text-xs text-black/40 italic">You haven't followed any artisans yet.</p>
                <button onClick={() => onPageChange('home')} className="mt-2 text-xs font-bold text-artisan-accent uppercase tracking-widest">Discover Creators</button>
              </div>
            ) : (
              <div className="space-y-4">
                {followedArtisans.map(artisan => (
                  <div key={artisan.id} className="flex items-center gap-4 p-4 rounded-3xl bg-black/5 hover:bg-black/10 transition-colors border border-black/5 group">
                    <div className="w-12 h-12 rounded-full bg-artisan-accent text-white flex items-center justify-center text-lg font-serif">
                      {artisan.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-sm">{artisan.name}</h5>
                      <p className="text-[10px] text-black/40 font-medium">{artisan.location}</p>
                    </div>
                    <button 
                      onClick={() => onToggleFollow(artisan.id)}
                      className="text-[10px] font-bold text-artisan-accent uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 pt-10 border-t border-black/5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-black/30 mb-4 px-2">Account Security</h4>
          <div className="space-y-2">
            <button className="w-full text-left p-4 rounded-2xl hover:bg-black/5 transition-colors text-sm font-medium flex justify-between items-center group">
              <span>Change Password</span>
              <ChevronRight size={16} className="text-black/20 group-hover:text-black transition-colors" />
            </button>
            <button className="w-full text-left p-4 rounded-2xl hover:bg-black/5 transition-colors text-sm font-medium flex justify-between items-center group">
              <span>Notification Settings</span>
              <ChevronRight size={16} className="text-black/20 group-hover:text-black transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Order History Component
const OrderHistory = ({ user }: { user: User }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const endpoint = user.role === 'Artisan' 
        ? `/api/artisan/orders/${user.id}` 
        : `/api/orders/${user.id}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error("Failed to fetch orders", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrders(); // Refresh list
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  if (loading) return <div className="text-center py-20 font-serif italic">Loading history...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
      <h2 className="text-4xl font-bold mb-8">{user.role === 'Artisan' ? 'Sales History' : 'Your Orders'}</h2>
      {orders.length === 0 ? (
        <div className="text-center py-20 artisan-card">
          <Package size={48} className="mx-auto mb-4 text-black/10" />
          <p className="text-black/40 italic">No orders found yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="artisan-card p-6">
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-black/40 block mb-1">Order ID</span>
                  <span className="font-mono text-sm">{order.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-black/40 block mb-1">Date</span>
                  <span className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-black/40 block mb-1">Status</span>
                  {user.role === 'Artisan' ? (
                    <select 
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="text-[10px] font-bold uppercase tracking-wider bg-white border border-black/10 rounded-full px-3 py-1 outline-none"
                    >
                      <option value="Placed">Placed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {order.status}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-black/40 block mb-1">Total</span>
                  <span className="text-xl font-bold text-artisan-accent">₹{order.total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-4 border-t border-black/5 pt-6">
                {order.items.map((item, idx) => {
                  const variation = item.variations?.find(v => v.id === item.selectedVariationId);
                  const price = item.price + (variation?.priceAdjustment || 0);
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <img src={item.image} className="w-12 h-12 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        {variation && (
                          <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest">
                            {variation.type}: {variation.value}
                          </p>
                        )}
                        <p className="text-xs text-black/50">{item.quantity} x ₹{price}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Artisan Dashboard Component
const ArtisanDashboard = ({ products, setProducts }: { products: Product[], setProducts: React.Dispatch<React.SetStateAction<Product[]>> }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    category: '', 
    image: '',
    variations: [] as Variation[]
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [artisanOrders, setArtisanOrders] = useState<Order[]>([]);
  const [insight, setInsight] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const fetchArtisanOrders = async () => {
      try {
        const res = await fetch('/api/artisan/orders/artisan_1');
        const data = await res.json();
        setArtisanOrders(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchArtisanOrders();
  }, []);

  const analyzeInventory = async () => {
    setIsAnalyzing(true);
    try {
      const myProducts = products.filter(p => p.artisanId === 'artisan_1');
      const context = {
        products: myProducts.map(p => ({ name: p.name, desc: p.description })),
        sales: artisanOrders.flatMap(o => o.items.map(i => i.name))
      };
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `As an AI Inventory Specialist for a craft shop, analyze this data: ${JSON.stringify(context)}. Identify which specific styles or variations appear to be trending vs potential "Dead Stock". Give a concrete production recommendation. Max 60 words.`,
      });
      setInsight(response.text || "");
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalEarnings = artisanOrders.reduce((acc, order) => acc + order.total, 0);

  const openAdd = () => {
    setEditingProduct(null);
    setNewProduct({ name: '', description: '', price: '', category: '', image: '', variations: [] });
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({ 
      name: product.name, 
      description: product.description, 
      price: product.price.toString(), 
      category: product.category, 
      image: product.image,
      variations: product.variations || []
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const productData = { 
      ...newProduct, 
      price: parseFloat(newProduct.price) || 0,
      variations: newProduct.variations
    };
    
    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
        const data = await res.json();
        setProducts(prev => prev.map(p => p.id === data.id ? data : p));
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...productData, artisanId: 'artisan_1', rating: 5.0 })
        });
        const data = await res.json();
        setProducts(prev => [data, ...prev]);
      }
      setShowModal(false);
      setNewProduct({ name: '', description: '', price: '', category: '', image: '', variations: [] });
    } catch (e) {
      console.error(e);
    }
  };

  const generateDescription = async () => {
    if (!newProduct.name) return alert("Please enter a product name first.");
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a short, poetic, and professional product description for a handcrafted item named "${newProduct.name}" in the category "${newProduct.category}". Focus on its authenticity and the artisan's skill. Keep it under 60 words.`,
      });
      setNewProduct(prev => ({ ...prev, description: response.text || '' }));
    } catch (e) {
      console.error("AI Generation failed", e);
      alert("Failed to generate description. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-bold mb-2">Artisan Dashboard</h2>
          <p className="text-black/50">Manage your handicraft collection and orders.</p>
        </div>
        <button className="artisan-button flex items-center gap-2" onClick={openAdd}>
          <Plus size={20} /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="artisan-card p-6 bg-artisan-accent text-white">
          <p className="text-white/70 text-sm uppercase tracking-widest mb-4">Total Earnings</p>
          <h3 className="text-3xl font-bold font-sans">₹{totalEarnings.toFixed(2)}</h3>
        </div>
        <div className="artisan-card p-6">
          <p className="text-black/40 text-sm uppercase tracking-widest mb-4">Active Products</p>
          <h3 className="text-3xl font-bold font-sans">{products.filter(p => p.artisanId === 'artisan_1').length}</h3>
        </div>
        <div className="artisan-card p-6">
          <p className="text-black/40 text-sm uppercase tracking-widest mb-4">New Orders</p>
          <h3 className="text-3xl font-bold font-sans">{artisanOrders.length}</h3>
        </div>
        <div className="artisan-card p-6">
          <p className="text-black/40 text-sm uppercase tracking-widest mb-4">Avg Rating</p>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-bold font-sans">4.9</h3>
            <Star size={20} fill="#f59e0b" className="text-amber-500" />
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-6">Your Inventory</h3>
      
      {/* AI Inventory Insights */}
      <div className="artisan-card p-8 mb-12 bg-gradient-to-br from-artisan-accent to-artisan-accent-light text-white relative overflow-hidden">
        <Sparkles className="absolute top-[-20px] right-[-20px] w-40 h-40 text-white/10 rotate-12" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <Sparkles size={20} />
              </div>
              <h4 className="text-xl font-bold font-serif italic">AI Inventory Insights</h4>
            </div>
            <button 
              onClick={analyzeInventory}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold uppercase tracking-widest transition-all backdrop-blur-sm"
            >
              {isAnalyzing ? "Analyzing..." : insight ? "Refine Analysis" : "Generate Analysis"}
            </button>
          </div>
          
          <div className="min-h-[60px]">
            {insight ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/90 mb-6 max-w-2xl leading-relaxed italic">
                {insight}
              </motion.p>
            ) : (
              <p className="text-white/60 mb-6 italic">
                Click "Generate Analysis" to see which of your products are trending and how to avoid dead stock.
              </p>
            )}
          </div>

          {insight && (
            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/20 inline-block">
              <span className="text-xs uppercase tracking-widest font-bold block mb-1 opacity-70">Inventory Tip</span>
              <p className="font-medium text-sm">Focus on artisan quality over high-volume generic designs.</p>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.filter(p => p.artisanId === 'artisan_1').map(p => (
          <div key={p.id} className="artisan-card p-4 flex gap-4">
            <img src={p.image} className="w-24 h-24 rounded-2xl object-cover" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-lg">{p.name}</h4>
                {p.bestSelling && (
                  <span className="bg-orange-500 text-white text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={8} /> Best Seller
                  </span>
                )}
              </div>
              <p className="text-artisan-accent">₹{p.price}</p>
              {p.variations && p.variations.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.variations.map(v => (
                    <span key={v.id} className="text-[8px] bg-black/5 px-1.5 py-0.5 rounded text-black/60">
                      {v.value}: {v.stock}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <button 
                  className="text-xs font-bold text-black/40 hover:text-black transition-colors uppercase tracking-widest"
                  onClick={() => openEdit(p)}
                >
                  Edit
                </button>
                <button 
                  className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest"
                  onClick={() => handleDelete(p.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-artisan-bg artisan-card max-w-xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-3xl font-bold mb-6">{editingProduct ? "Edit Handcrafted Item" : "Add New Handcrafted Item"}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Product Name</label>
                <input 
                  type="text" 
                  value={newProduct.name} 
                  onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="artisan-input w-full"
                  placeholder="e.g. Hand-painted Terracotta Pot"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Category</label>
                <select 
                   value={newProduct.category} 
                   onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                   className="artisan-input w-full bg-white"
                >
                  <option value="">Select Category</option>
                  <option value="Pottery">Pottery</option>
                  <option value="Textiles">Textiles</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Decor">Decor</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40 block">Description</label>
                  <button 
                    onClick={generateDescription}
                    disabled={isGenerating}
                    className="text-[10px] flex items-center gap-1 font-bold text-artisan-accent bg-artisan-accent/10 px-3 py-1 rounded-full hover:bg-artisan-accent/20 transition-all uppercase tracking-[2px]"
                  >
                    <Sparkles size={12} /> {isGenerating ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <textarea 
                   value={newProduct.description} 
                   onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                   className="artisan-input w-full h-32 resize-none"
                   placeholder="Describe your craft's soul..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 block">Price (₹)</label>
                  <input 
                    type="number" 
                    value={newProduct.price} 
                    onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    className="artisan-input w-full"
                  />
                </div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40 block">Image URL</label>
                  <button 
                    onClick={async () => {
                      if (!newProduct.image) return alert("Enter image URL first");
                      setIsGenerating(true);
                      try {
                        const response = await ai.models.generateContent({
                          model: "gemini-3-flash-preview",
                          contents: [
                            { text: "Look at this product image and tell me which category it belongs to: Pottery, Textiles, Jewelry, or Decor. Return ONLY the category name." },
                            { inlineData: { data: "", mimeType: "image/jpeg" } } // In a real app we'd fetch the image, but for this demo I'll simulate with a text-based guess as fetching remote images in browser can hit CORS
                          ]
                        });
                        // Since I can't easily fetch remote images due to CORS in a browser environment without a proxy,
                        // I will use a clever prompt that looks at the filename/URL context if image is hard, 
                        // but better to just use a text prompt for this demo to show the UX flow.
                        const catResponse = await ai.models.generateContent({
                          model: "gemini-3-flash-preview",
                          contents: `Based on this image URL "${newProduct.image}", what is the most likely handicraft category? pottery, textiles, jewelry, decor. Return only the category name.`
                        });
                        const suggested = catResponse.text?.trim().charAt(0).toUpperCase() + catResponse.text?.trim().slice(1).toLowerCase();
                        if (['Pottery', 'Textiles', 'Jewelry', 'Decor'].includes(suggested || "")) {
                          setNewProduct(prev => ({ ...prev, category: suggested || "" }));
                        }
                      } catch(e) { console.error(e) } finally { setIsGenerating(false) }
                    }}
                    className="text-[10px] flex items-center gap-1 font-bold text-artisan-accent bg-artisan-accent/10 px-3 py-1 rounded-full hover:bg-artisan-accent/20 transition-all uppercase tracking-[2px]"
                  >
                    Analyze
                  </button>
                </div>
                <input 
                  type="text" 
                  value={newProduct.image} 
                  onChange={e => setNewProduct(prev => ({ ...prev, image: e.target.value }))}
                  className="artisan-input w-full"
                  placeholder="https://..."
                />
              </div>

              {/* Variations Section */}
              <div className="border-t border-black/5 pt-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-black/60 font-serif italic">Product Variations</h4>
                  <button 
                    onClick={() => setNewProduct(prev => ({ 
                      ...prev, 
                      variations: [...prev.variations, { id: Date.now().toString(), type: 'Color', value: '', stock: 0, priceAdjustment: 0 }] 
                    }))}
                    className="text-[10px] font-bold text-artisan-accent bg-artisan-accent/10 px-3 py-1 rounded-full hover:bg-artisan-accent/20 transition-all uppercase tracking-widest"
                  >
                    Add Variation
                  </button>
                </div>
                
                <div className="space-y-4">
                  {newProduct.variations.length === 0 ? (
                    <p className="text-[10px] text-center text-black/30 italic">No variations added. Use variations for different sizes, colors, or materials.</p>
                  ) : (
                    newProduct.variations.map((v, idx) => (
                      <div key={v.id} className="bg-black/5 p-4 rounded-2xl relative border border-black/5">
                        <button 
                          onClick={() => setNewProduct(prev => ({ ...prev, variations: prev.variations.filter((_, i) => i !== idx) }))}
                          className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 block mb-1">Type (e.g. Size)</label>
                            <input 
                              type="text" 
                              value={v.type}
                              onChange={e => {
                                const updated = [...newProduct.variations];
                                updated[idx].type = e.target.value;
                                setNewProduct(prev => ({ ...prev, variations: updated }));
                              }}
                              className="artisan-input py-2 text-xs w-full bg-white border-black/5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 block mb-1">Value (e.g. XL)</label>
                            <input 
                              type="text" 
                              value={v.value}
                              onChange={e => {
                                const updated = [...newProduct.variations];
                                updated[idx].value = e.target.value;
                                setNewProduct(prev => ({ ...prev, variations: updated }));
                              }}
                              className="artisan-input py-2 text-xs w-full bg-white border-black/5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 block mb-1">Stock</label>
                            <input 
                              type="number" 
                              value={v.stock}
                              onChange={e => {
                                const updated = [...newProduct.variations];
                                updated[idx].stock = parseInt(e.target.value) || 0;
                                setNewProduct(prev => ({ ...prev, variations: updated }));
                              }}
                              className="artisan-input py-2 text-xs w-full bg-white border-black/5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 block mb-1">Price Adjust (₹)</label>
                            <input 
                              type="number" 
                              value={v.priceAdjustment}
                              onChange={e => {
                                const updated = [...newProduct.variations];
                                updated[idx].priceAdjustment = parseFloat(e.target.value) || 0;
                                setNewProduct(prev => ({ ...prev, variations: updated }));
                              }}
                              className="artisan-input py-2 text-xs w-full bg-white border-black/5"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button className="flex-1 artisan-button py-4" onClick={handleSave}>
                {editingProduct ? "Update Product" : "List Product"}
              </button>
              <button className="flex-1 border border-black/10 rounded-full py-4 font-bold hover:bg-black/5" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

