import { render, screen, fireEvent } from '@testing-library/react'
import StarRating from '../StarRating'

describe('StarRating', () => {
  describe('Display Mode', () => {
    it('renders null rating as empty stars', () => {
      render(<StarRating rating={null} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(5)
    })

    it('renders full stars for whole number rating', () => {
      render(<StarRating rating={4} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(5)
      // Should show 4 filled stars and 1 empty
    })

    it('renders half stars for decimal rating', () => {
      render(<StarRating rating={3.5} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(5)
      // Should show 3 full stars, 1 half star, and 1 empty
    })

    it('displays rating value as text', () => {
      render(<StarRating rating={4.5} />)
      expect(screen.getByText('4.5')).toBeInTheDocument()
    })

    it('does not display text when rating is null', () => {
      render(<StarRating rating={null} />)
      const text = screen.queryByText(/\d\.\d/)
      expect(text).not.toBeInTheDocument()
    })

    it('renders custom max rating', () => {
      render(<StarRating rating={3} maxRating={10} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(10)
    })

    it('renders correct size classes', () => {
      const { rerender } = render(<StarRating rating={3} size="sm" />)
      let buttons = screen.getAllByRole('button')
      expect(buttons[0]).toHaveClass('w-4', 'h-4')

      rerender(<StarRating rating={3} size="md" />)
      buttons = screen.getAllByRole('button')
      expect(buttons[0]).toHaveClass('w-5', 'h-5')

      rerender(<StarRating rating={3} size="lg" />)
      buttons = screen.getAllByRole('button')
      expect(buttons[0]).toHaveClass('w-6', 'h-6')
    })

    it('stars are disabled in display mode', () => {
      render(<StarRating rating={3} editable={false} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })
  })

  describe('Editable Mode', () => {
    it('stars are enabled in editable mode', () => {
      const onChange = jest.fn()
      render(<StarRating rating={null} editable={true} onChange={onChange} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).not.toBeDisabled()
      })
    })

    it('calls onChange when star is clicked', () => {
      const onChange = jest.fn()
      render(<StarRating rating={null} editable={true} onChange={onChange} />)
      const buttons = screen.getAllByRole('button')

      fireEvent.click(buttons[2]) // Click 3rd star
      expect(onChange).toHaveBeenCalledWith(3)
    })

    it('allows clicking different stars to change rating', () => {
      const onChange = jest.fn()
      render(<StarRating rating={2} editable={true} onChange={onChange} />)
      const buttons = screen.getAllByRole('button')

      fireEvent.click(buttons[4]) // Click 5th star
      expect(onChange).toHaveBeenCalledWith(5)

      fireEvent.click(buttons[0]) // Click 1st star
      expect(onChange).toHaveBeenCalledWith(1)
    })

    it('does not call onChange when not editable', () => {
      const onChange = jest.fn()
      render(<StarRating rating={3} editable={false} onChange={onChange} />)
      const buttons = screen.getAllByRole('button')

      fireEvent.click(buttons[4])
      expect(onChange).not.toHaveBeenCalled()
    })

    it('does not call onChange when onChange is not provided', () => {
      render(<StarRating rating={3} editable={true} />)
      const buttons = screen.getAllByRole('button')

      // Should not throw error
      expect(() => fireEvent.click(buttons[2])).not.toThrow()
    })

    it('has hover effect in editable mode', () => {
      const onChange = jest.fn()
      render(<StarRating rating={null} editable={true} onChange={onChange} />)
      const buttons = screen.getAllByRole('button')

      expect(buttons[0]).toHaveClass('cursor-pointer', 'hover:scale-110')
    })

    it('has default cursor in display mode', () => {
      render(<StarRating rating={3} editable={false} />)
      const buttons = screen.getAllByRole('button')

      expect(buttons[0]).toHaveClass('cursor-default')
      expect(buttons[0]).not.toHaveClass('cursor-pointer')
    })
  })

  describe('Accessibility', () => {
    it('has aria-label for each star', () => {
      render(<StarRating rating={3} />)

      expect(screen.getByLabelText('1 star')).toBeInTheDocument()
      expect(screen.getByLabelText('2 stars')).toBeInTheDocument()
      expect(screen.getByLabelText('3 stars')).toBeInTheDocument()
      expect(screen.getByLabelText('4 stars')).toBeInTheDocument()
      expect(screen.getByLabelText('5 stars')).toBeInTheDocument()
    })

    it('uses singular "star" for rating of 1', () => {
      render(<StarRating rating={1} />)
      expect(screen.getByLabelText('1 star')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles rating of 0', () => {
      render(<StarRating rating={0} />)
      // Rating of 0 displays as "0" not "0.0"
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles maximum rating of 5', () => {
      render(<StarRating rating={5} />)
      expect(screen.getByText('5.0')).toBeInTheDocument()
    })

    it('handles very small decimal ratings', () => {
      render(<StarRating rating={0.1} />)
      expect(screen.getByText('0.1')).toBeInTheDocument()
    })

    it('defaults to 5 stars when maxRating not provided', () => {
      render(<StarRating rating={3} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(5)
    })

    it('defaults to non-editable when editable not provided', () => {
      render(<StarRating rating={3} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })

    it('defaults to medium size when size not provided', () => {
      render(<StarRating rating={3} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons[0]).toHaveClass('w-5', 'h-5')
    })
  })
})
