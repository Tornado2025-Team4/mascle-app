import Header from "./_components/header";
import PostList from "./_components/postlist";

export default async function Home() {
  return (
    <div className="min-h-screen pb-[10vh]">
      <Header />
      <main className="h-[80vh] space-y-4 p-4 overflow-y-auto">
        <PostList />
      </main>
    </div>
  );
}
