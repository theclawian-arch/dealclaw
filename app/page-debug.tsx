<div className="max-w-lg mx-auto px-4 py-4 pb-20">
      <div className="text-yellow-300 text-center p-4 bg-yellow-500 font-mono">DEBUG LOADING Items: ${items.length}
      ${items.map(i => `${i.title} (${i.price || '?'} ${i.retailer}) `[0, 40])).join('\n')}}\
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🦞</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 text-sm mb-6">
            Add items from any fashion site and we'll find the best deals for you
          </p>
          <a
            href="/share"
            className="inline-block bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl"
          >
            Start adding items
          </a>
        </div>
      ) : (
        <>
          {/* Debug item list */}
          <div className="bg-red-50 border-2 border-red-400 p-4 mb-4 font-mono text-sm">
            <div className="text-red-800 font-bold">DEBUG ITEMS ({items.length}):</div>
            {items.map((item, idx) => (
              <div key={item.id} className="text-xs">
                {idx+1}. {item.title} - {item.price || '[NO PRICE]'} - {item.retailer}
              </div>
            ))}
          </div>

          {/* Basket Calculation */}
          <div className="bg-green-100 border-2 border-green-400 p-4 mb-4 text-center font-bold text-lg">
            TOTAL: €{items.reduce((sum, item) => {
              const num = item.price.match(/\d+/)
              return sum + (num ? parseFloat(num[0]) : 0)
            }, 0).toFixed(2)}
          </div>

          {/* Products */}
          <div className="grid grid-cols-2 gap-3">
            {items.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onDelete={null}
                selected={false}
                onToggleSelect={null}
              />
            ))}
          </div>
        </>
      )}
    </div>