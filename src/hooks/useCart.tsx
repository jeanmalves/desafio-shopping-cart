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
      const updatedCart = [...cart];

      const productExists = updatedCart.find(product => product.id === productId);

      const stock = await api.get<Stock>(`stock/${productId}`).then((response) => response.data);
      const amount = productExists ? productExists.amount + 1 : 1;

      if(stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        productExists.amount = amount;
        
      } else {
        const product =  await api.get<Product>(`/products/${productId}`).then((response) => response.data);
        const newProduct = {
          ...product,
          amount
        }

        updatedCart.push(newProduct);
      }
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      
      setCart(updatedCart);
    } catch(e) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productFound = cart.find(product => product.id === productId);

      if (!productFound) {
        toast.error('Erro na remoção do produto');
        return;
      }
      
      const newCart = cart.filter(product =>  product.id !== productFound.id);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));  

      setCart(newCart);

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const stock = await api.get<Stock>(`stock/${productId}`).then((response) => response.data);
      
      if(stock && (stock.amount <= 0 || stock.amount < amount)) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      const productFound = cart.find(product => product.id === productId);
      
      if (productFound) {
        productFound.amount = amount;

        const productIndex = cart.findIndex(item => item.id === productFound.id);
        
        const updatedCart = [...cart];
        updatedCart[productIndex] = productFound;

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));  
        setCart(updatedCart);
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
