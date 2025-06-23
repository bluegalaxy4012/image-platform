export default function Home() {

    return (
        <div>
        <h1 className="text-4xl font-bold mb-8">Image Platform</h1>
        <form
            className="flex flex-col items-center"
            onSubmit={(e) => {
            e.preventDefault();
            const imageId = (e.target as HTMLFormElement).elements.namedItem('imageId') as HTMLInputElement;
            if (imageId.value) {
                window.location.href = `/images/${imageId.value}`;
            }
            }}
        >
            <input
            type="text"
            name="imageId"
            placeholder="Enter Image ID"
            className="p-2 border border-gray-300 rounded mb-4"
            />
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            View Image
            </button>
        </form>
        </div>
    );
}