import { render, screen } from '@testing-library/react'
import Navigation from '../Navigation'

describe('Navigation', () => {
  it('renders the app title', () => {
    render(<Navigation />)
    const title = screen.getByText('Recipe Manager')
    expect(title).toBeInTheDocument()
  })

  it('renders Home link', () => {
    render(<Navigation />)
    const homeLinks = screen.getAllByText('Home')
    expect(homeLinks.length).toBeGreaterThan(0)
  })

  it('renders Categories link', () => {
    render(<Navigation />)
    const categoriesLink = screen.getByText('Categories')
    expect(categoriesLink).toBeInTheDocument()
  })

  it('Categories link points to correct page', () => {
    render(<Navigation />)
    const categoriesLink = screen.getByText('Categories')
    const link = categoriesLink.closest('a')
    expect(link).toHaveAttribute('href', '/categories')
  })

  it('renders Create Recipe button', () => {
    render(<Navigation />)
    const createButton = screen.getByText('+ Create Recipe')
    expect(createButton).toBeInTheDocument()
  })

  it('Create Recipe button links to correct page', () => {
    render(<Navigation />)
    const createButton = screen.getByText('+ Create Recipe')
    const link = createButton.closest('a')
    expect(link).toHaveAttribute('href', '/recipes/new')
  })

  it('Home link points to root path', () => {
    render(<Navigation />)
    const homeLinks = screen.getAllByText('Home')
    const homeLink = homeLinks[0].closest('a')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('has correct styling classes', () => {
    render(<Navigation />)
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('bg-blue-600')
    expect(nav).toHaveClass('text-white')
  })
})
