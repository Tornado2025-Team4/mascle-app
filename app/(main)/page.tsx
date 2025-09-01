import Header from "./_components/header";
import PostList from "./_components/postlist";

export default function Home() {
  return (
    <div>
      <Header />
      <main className="h-[80vh]">
          <PostList/>
      </main>
    </div>
  );
}
