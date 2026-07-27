// نستورد الأدوات التي نحتاجها من React:

import {
  createContext,
  useContext,
  useMemo,
  useState,
    useEffect,
} from 'react'


// ننشئ Context جديدًا خاصًا بالسلة.

const CartContext = createContext(null)
// **************************************************************************************************

// CartProvider هو المكوّن المسؤول عن تخزين السلة
// ومشاركة بياناتها ووظائفها مع بقية مكونات المشروع.
//
// children تعني جميع المكونات الموجودة داخل CartProvider.
//
// مثال:
// <CartProvider>
//   <App />
// </CartProvider>
//
// هنا App تعتبر children.
export function CartProvider({ children }) {
  // cart:
  // تحتوي على المنتجات الموجودة حاليًا داخل السلة.
  const [cart, setCart] = useState([])
 
// اسم الصفحة الحالية
  const [pageTitle, setPageTitle] = useState('Home')

  // تغيير عنوان تبويب المتصفح
  useEffect(() => {
    document.title = `Syrup | ${pageTitle}`
  }, [pageTitle])

// **************** دالة إضافة منتج إلى السلة.***************************
  const addToCart = (item) => {

    setCart((current) => {

      // نبحث داخل السلة عن منتج يحمل نفس id
      // الخاص بالمنتج الذي نريد إضافته.
      //
      // find ترجع المنتج إذا وجدته،
      // وترجع undefined إذا لم تجده.
      const existing = current.find((product) => product.id === item.id)


      //1  لانضيف نسخة جديدة منه. بدلًا من ذلك نزيد الكمية بمقدارquantity   .إذا كان المنتج موجودًا أصلًا داخل السلة،

      if (existing) {


        // map تمر على جميع منتجات السلة
        // وتُرجع مصفوفة جديدة بعد التعديل.
        return current.map((product) =>


          // نتحقق هل هذا هو المنتج المطلوب تعديله.
          product.id === item.id


            // إذا كان هو المنتج المطلوب:
            // ننسخ جميع خصائص المنتج باستخدام ...
            // ثم نزيد quantity بمقدار 1.
            ? {
              ...product,
              quantity: product.quantity + 1,
            }


            // إذا لم يكن هو المنتج المطلوب،
            // نعيده كما هو دون أي تعديل.
            : product
        )
      }


      // إذا لم يكن المنتج موجودًا داخل السلة:
      // ننشئ مصفوفة جديدة تحتوي على:
   
      return [
        ...current,
        {
          ...item,
          quantity: 1,
        },
      ]
    })
  }

// ****************  دالة إنقاص كمية المنتج********************************

  const decrease = (id) => {


    // نحدّث السلة اعتمادًا على أحدث قيمة لها.
    setCart((current) =>


      // أولًا نمر على جميع المنتجات باستخدام map.
      current.map((item) =>


        // إذا كان id المنتج يساوي id المطلوب:
        item.id === id


          // ننسخ المنتج وننقص الكمية بمقدار 1.
          ? {
            ...item,
            quantity: item.quantity - 1,
          }


          // المنتجات الأخرى تبقى كما هي.
          : item
      )


        // بعد إنقاص الكمية، نحذف أي منتج
        // أصبحت كميته صفرًا أو أقل.
        //
        // filter تحتفظ فقط بالمنتجات
        // التي تكون كميتها أكبر من صفر.
        .filter((item) => item.quantity > 0)
    )
  }

// **************** دالة حذف المنتج بالكامل من السلة.***************************

  const removeFromCart = (id) => {


    // نحتفظ بجميع المنتجات التي لا يساوي id الخاص بها
    // id المنتج المطلوب حذفه.
    setCart((current) => current.filter((item) => item.id !== id)
    )
  }

// **************** دالة تفريغ السلة بالكامل.***************************

  const clearCart = () => {
    setCart([])
  }

// ****************حساب العدد الإجمالي للقطع داخل السلة.  ***************************

  const totalItems = useMemo(() => {


    return cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    )


    // لا يُعاد الحساب إلا عندما تتغير cart.
  }, [cart])
// ****************   حساب السعر الإجمالي لجميع المنتجات داخل السلة. ***************************

  const totalPrice = useMemo(() => {


    // لكل منتج:
    // السعر × الكمية
    //
    // ثم تجمع نتيجة جميع المنتجات.
    return cart.reduce((sum, item) =>sum + Number(item.price) * item.quantity, 0)


    // لا يُعاد الحساب إلا عندما تتغير cart.
  }, [cart])


  // Provider يشارك بيانات السلة ودوالها
  // مع جميع المكونات الموجودة داخله.
  return (
    <CartContext.Provider
      value={{
       
        cart,

  
        addToCart,

  
        decrease,

       
        removeFromCart,

  
        clearCart,

   
        totalItems,

    
        totalPrice,
         // عنوان الصفحة
        pageTitle,
        setPageTitle,
      }}
    >

  
      {children}

    </CartContext.Provider>
  )
}

// **************************************************************************************************
// اخراج 
export const useCart = () => {
  const context = useContext(CartContext)
 return context
}