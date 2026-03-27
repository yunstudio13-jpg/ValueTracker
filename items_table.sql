CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
  brand VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  notes TEXT,
  cover_image VARCHAR(500),
  category_id VARCHAR(50),
  emoji VARCHAR(10),
  warranty_expiry TIMESTAMP WITH TIME ZONE,
  resale_value DECIMAL(10, 2),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加外键约束（如果 users 表存在）
ALTER TABLE items ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- 添加索引
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_items_purchase_date ON items(purchase_date);