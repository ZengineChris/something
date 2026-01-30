{
  description = "Chat Flow Engine - Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            biome
            typescript-go
          ];

          shellHook = ''
            echo "Chat Flow Engine Development Environment"
            echo "Node.js: $(node --version)"
            echo "Biome: $(biome --version)"
            echo "tsgo: $(tsgo --version)"
          '';
        };
      }
    );
}
