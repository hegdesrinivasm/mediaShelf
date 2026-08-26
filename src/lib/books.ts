export function mapOpenLibraryToBookDetails(doc: any) {
	return {
		author: doc.author_name?.[0] ?? null,
		publisher: doc.publisher?.[0] ?? null,
		isbn: doc.isbn?.[0] ?? null,
		page_count: doc.number_of_pages_median ?? null,
		series: null,
		cover_url: doc.cover_i
			? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
			: doc.cover_edition_key
				? `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-L.jpg`
				: null,
		title: doc.title ?? null,
		year: doc.first_publish_year ?? null
	};
}

export function mapGoogleBooksToBookDetails(item: any) {
	const info = item.volumeInfo ?? {};
	return {
		author: info.authors?.[0] ?? null,
		publisher: info.publisher ?? null,
		isbn: info.industryIdentifiers?.[0]?.identifier ?? null,
		page_count: info.pageCount ?? null,
		series: null,
		cover_url: info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null,
		title: info.title ?? null,
		year: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : null
	};
}
