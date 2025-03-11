export default function NavBar() {
  return (
    <nav className="flex justify-between items-center p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <a
        className="w-10 h-10"
        href="https://github.com/dangello-g/websockets-react"
        target="_blank"
      >
        <img
          src="https://raw.githubusercontent.com/devicons/devicon/refs/heads/master/icons/github/github-original.svg"
          alt="Github"
          className="w-full h-full"
        />
      </a>
    </nav>
  );
}
