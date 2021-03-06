import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = getItems();

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  
  function getItems() : string | null {
    return localStorage.getItem('@RocketShoes:cart');
  }

  const addProduct = async (productId: number) => {
    try {
      const product = await api.get<Product>(`/products/${productId}`).then((response) => response.data);
      const stock = await api.get<Stock>(`stock/${productId}`).then((response) => response.data);
      
      if(stock && stock.amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      const productFound = cart.find(el => el.id === product.id);
      
      if (!productFound) {
        product.amount = 1;
        const newProducts = [...cart, product];
        
        const cartStorage = JSON.stringify(newProducts);
        localStorage.setItem('@RocketShoes:cart', cartStorage);

        setCart(newProducts);
      } else {
        const productIndex = cart.findIndex(el => el.id === product.id);
        
        productFound.amount = productFound.amount + 1;

        const newCart = [...cart];
        newCart[productIndex] = productFound;

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

        setCart(newCart);
      }

    } catch(e) {
      toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
