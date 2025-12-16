import StoreLayout from './StoreLayout';
import styles from './info.module.css';

export default function AboutPage() {
  return (
    <StoreLayout>
      <div className={styles.infoContainer}>
        <h1>About Us</h1>
        <p>
          Welcome to our store! We are passionate about bringing you the best products and a seamless shopping experience. Our team is dedicated to quality, service, and supporting our local community.
        </p>
      </div>
    </StoreLayout>
  );
}
