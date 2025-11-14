import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:text-blue-200 transition">
            Recipe Manager
          </Link>
          <div className="flex gap-6">
            <Link
              href="/"
              className="hover:text-blue-200 transition font-medium"
            >
              Home
            </Link>
            <Link
              href="/categories"
              className="hover:text-blue-200 transition font-medium"
            >
              Categories
            </Link>
            <Link
              href="/grocery-list"
              className="hover:text-blue-200 transition font-medium"
            >
              Grocery List
            </Link>
            <Link
              href="/meal-plans"
              className="hover:text-blue-200 transition font-medium"
            >
              Meal Plans
            </Link>
            <Link
              href="/recipes/new"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition font-medium"
            >
              + Create Recipe
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
