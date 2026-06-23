import styles from '@/app/page.module.css';

interface GridAdCardProps {
  size: '2x2' | '2x1';
  ad: {
    title: string;
    description: string;
    icon: string;
    link: string;
    colorTheme?: string;
  };
}

export default function GridAdCard({ size, ad }: GridAdCardProps) {
  const spanClass = size === '2x2' ? styles.span2x2 : styles.span2x1;
  const isCyan = ad.colorTheme === 'cyan';
  const isGreen = ad.colorTheme === 'green';
  
  let btnStyle = styles.adBtn;
  if (isCyan) {
    btnStyle = `${styles.adBtn} ${styles.adBtnCyan}`;
  } else if (isGreen) {
    btnStyle = `${styles.adBtn} ${styles.adBtnGreen || ''}`;
  }

  return (
    <div className={`${styles.adCard} ${spanClass}`}>
      <span className={styles.adLabel}>Ad</span>
      <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{ad.icon || '📢'}</div>
      <h3 className={styles.adTitle}>{ad.title}</h3>
      <p className={styles.adText} style={{ display: size === '2x2' ? 'block' : 'none' }}>
        {ad.description}
      </p>
      <a href={ad.link} className={btnStyle} style={{ textDecoration: 'none' }}>
        {ad.icon} PLAY NOW
      </a>
    </div>
  );
}
