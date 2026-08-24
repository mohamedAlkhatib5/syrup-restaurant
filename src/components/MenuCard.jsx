import { FaPlus } from 'react-icons/fa';
import useCart from '../hooks/useCart';
import '../pages.css/MenuCard.css';
// بطاقة طبق واحدة: تعرض الصورة والوصف والسعر وتضيف الطبق إلى السلة.
function MenuCard({ item }) {
  const { addToCart } = useCart();
  return (
    <article className="dish-item h-100">
      <div className="dish-image-wrapper">
        <img src={item.image} alt={item.name} className="dish-image img-fluid w-100" />

        <span className="dish-category badge rounded-pill">{item.category}</span>
      </div>

      <div className="dish-content p-4">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <h3 className="dish-name h5 fw-bold mb-0">{item.name}</h3>

          <p className="dish-price fw-bold mb-2">{item.price}</p>
        </div>

        <p className="dish-description mb-2">{item.description}</p>
        <button onClick={() => addToCart(item)}>
          {' '}
          <FaPlus /> Add to order
        </button>
      </div>
    </article>
  );
}
export default MenuCard;
