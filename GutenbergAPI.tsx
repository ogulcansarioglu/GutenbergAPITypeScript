type PersonJson = {
    birth_year: number;
    death_year: number;
    name: string;
};

class Person {
    birthYear: number;
    deathYear: number;
    name: string;

    constructor(birthYear: number, deathYear: number, name: string) {
        this.birthYear = birthYear;
        this.deathYear = deathYear;
        this.name = name;
    }

    static fromJson(json: PersonJson): Person {
        return new Person(json.birth_year, json.death_year, json.name);
    }
}

type BookJson = {
    id: number;
    title: string;
    authors: PersonJson[];
    translators: PersonJson[];
    subjects: string[];
    bookshelves: string[];
    languages: string[];
    copyright: boolean;
    media_type: string;
    formats: { [key: string]: string };
    download_count: number;
};

class Book {
    id: number;
    title: string;
    authors: Person[];
    translators: Person[];
    subjects: string[];
    bookshelves: string[];
    languages: string[];
    copyright: boolean;
    mediaType: string;
    formats: { [key: string]: string };
    downloadCount: number;

    constructor(
        id: number,
        title: string,
        authors: Person[],
        translators: Person[],
        subjects: string[],
        bookshelves: string[],
        languages: string[],
        copyright: boolean,
        mediaType: string,
        formats: { [key: string]: string },
        downloadCount: number
    ) {
        if (id < 1) {
            throw new Error("Book IDs must be positive integers.");
        }

        this.id = id;
        this.title = title;
        this.authors = authors;
        this.translators = translators;
        this.subjects = subjects;
        this.bookshelves = bookshelves;
        this.languages = languages;
        this.copyright = copyright;
        this.mediaType = mediaType;
        this.formats = formats;
        this.downloadCount = downloadCount;
    }

    static fromJson(json: BookJson): Book {
        return new Book(
            json.id,
            json.title,
            json.authors.map(Person.fromJson),
            json.translators.map(Person.fromJson),
            json.subjects,
            json.bookshelves,
            json.languages,
            json.copyright,
            json.media_type,
            json.formats,
            json.download_count
        );
    }
}


class GutenbergAPI {
    private instanceUrl: string;

    constructor(instanceUrl: string = "https://gutendex.com/") {
        this.instanceUrl = instanceUrl;
    }

    private async fetchFromAPI(endpoint: string, params?: any): Promise<any> {
        const url = new URL(endpoint, this.instanceUrl);
        if (params) {
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    private async getBooks(params?: any): Promise<Book[]> {
        try {
            const resJson = await this.fetchFromAPI('/books', params);
            if (resJson.detail) {
                throw new Error(resJson.detail);
            }
            return resJson.results.map((bookJson: any) => Book.fromJson(bookJson));
        } catch (error) {
            console.error('Error fetching books:', error);
            throw error;
        }
    }

    public getAllBooks(): Promise<Book[]> {
        return this.getBooks();
    }

    public getPublicDomainBooks(): Promise<Book[]> {
        return this.getBooks({ copyright: "false" });
    }

    public getCopyrightedBooks(): Promise<Book[]> {
        return this.getBooks({ copyright: "true" });
    }

    public getBooksByIds(ids: number[]): Promise<Book[]> {
        return this.getBooks({ ids: ids.join(",") });
    }

    public getBooksByLanguage(languages: string[]): Promise<Book[]> {
        return this.getBooks({ languages: languages.join(",") });
    }

    public getBooksBySearch(query: string): Promise<Book[]> {
        return this.getBooks({ search: query });
    }

    public getBooksByMimeType(mimeType: string): Promise<Book[]> {
        return this.getBooks({ mime_type: mimeType });
    }

    public getBooksAscending(): Promise<Book[]> {
        return this.getBooks({ sort: "ascending" });
    }

    public getOldestBooks(): Promise<Book[]> {
        return this.getBooks({ sort: "oldest" });
    }
    public async getBookText(id: number): Promise<string> {
        try {
            const book = await this.getBook(id);
            let textUrl = book.formats['text/plain'];
            console.log(book)
            if (!textUrl) {
                console.log("Not available in that format");
                textUrl = book.formats['text/plain; charset=us-ascii']
            }
            console.log(textUrl)
            const response = await fetch(textUrl);
            console.log(response)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.text();
        } catch (error) {
            console.error(`Error fetching text for book with ID ${id}:`, error);
            throw error;
        }
    }

    public async getBookCover(id: number): Promise<string> {
        try {
            const book = await this.getBook(id);
            const coverUrl = book.formats['image/jpeg'];

            if (!coverUrl) {
                throw new Error("Cover image not available for this book.");
            }

            // Directly return the URL of the cover image
            return coverUrl;
        } catch (error) {
            console.error(`Error fetching cover for book with ID ${id}:`, error);
            throw error;
        }
    }


    public getLatestBooks(topic?: string): Promise<Book[]> {
        return this.getBooks({ topic: topic, sort: "latest" });
    }

    public async getBook(id: number): Promise<Book> {
        try {
            const resJson = await this.fetchFromAPI(`/books/${id}`);
            if (resJson.detail) {
                throw new Error(resJson.detail);
            }
            return Book.fromJson(resJson);
        } catch (error) {
            console.error(`Error fetching book with ID ${id}:`, error);
            throw error;
        }
    }
}



export default GutenbergAPI;
