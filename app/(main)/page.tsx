import Header from "./_components/header";
import PostList from "./_components/postlist";

export default function Home() {
  return (
    <div>
      <Header />
      <main>
          <PostList/>
      </main>
    </div>
  );
}
