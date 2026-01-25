import { Product } from '@/types/product'

export interface ProductTreeNode extends Product {
  children: ProductTreeNode[]
  path: string // Full path from root (e.g., "Category > Subcategory > Product")
}

/**
 * Builds a hierarchical tree structure from a flat list of products
 */
export function buildProductTree(products: Product[]): ProductTreeNode[] {
  // Create a map for quick lookup
  const productMap = new Map<string, ProductTreeNode>()
  
  // Initialize all products as tree nodes
  products.forEach((product) => {
    productMap.set(product.id, {
      ...product,
      children: [],
      path: product.name,
    })
  })

  // Build the tree structure
  const roots: ProductTreeNode[] = []

  products.forEach((product) => {
    const node = productMap.get(product.id)!
    
    if (product.parent_id) {
      const parent = productMap.get(product.parent_id)
      if (parent) {
        parent.children.push(node)
        // Build path from root
        node.path = `${parent.path} > ${node.name}`
      } else {
        // Parent not found, treat as root
        roots.push(node)
      }
    } else {
      // Root product
      roots.push(node)
    }
  })

  // Sort by level and name
  const sortTree = (nodes: ProductTreeNode[]): ProductTreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level
        return a.name.localeCompare(b.name)
      })
      .map((node) => ({
        ...node,
        children: sortTree(node.children),
      }))
  }

  return sortTree(roots)
}

/**
 * Flattens a tree structure into a list with indentation info for display
 */
export function flattenProductTree(
  tree: ProductTreeNode[],
  excludeId?: string
): Array<ProductTreeNode & { displayName: string; indent: number }> {
  const result: Array<ProductTreeNode & { displayName: string; indent: number }> = []

  const traverse = (nodes: ProductTreeNode[], indent: number = 0) => {
    nodes.forEach((node) => {
      // Skip the node being edited (to prevent selecting itself as parent)
      if (node.id === excludeId) {
        traverse(node.children, indent)
        return
      }

      const prefix = indent > 0 ? '  '.repeat(indent) + '└─ ' : ''
      result.push({
        ...node,
        displayName: `${prefix}${node.name}`,
        indent,
      })

      if (node.children.length > 0) {
        traverse(node.children, indent + 1)
      }
    })
  }

  traverse(tree)
  return result
}

/**
 * Gets all ancestors of a product (path to root)
 */
export function getProductAncestors(
  productId: string,
  products: Product[]
): Product[] {
  const productMap = new Map(products.map((p) => [p.id, p]))
  const ancestors: Product[] = []
  let currentId: string | null = productId

  while (currentId) {
    const product = productMap.get(currentId)
    if (!product) break

    if (product.parent_id) {
      const parent = productMap.get(product.parent_id)
      if (parent) {
        ancestors.unshift(parent)
        currentId = product.parent_id
      } else {
        break
      }
    } else {
      break
    }
  }

  return ancestors
}
